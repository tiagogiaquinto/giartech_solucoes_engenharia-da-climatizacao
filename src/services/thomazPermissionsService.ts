/**
 * Thomaz Permissions Service
 *
 * Controle de acesso baseado em roles e sensitivity levels
 * Implementa verificações de permissões antes de retornar dados
 */

export type UserRole = 'admin' | 'gestor' | 'financeiro' | 'vendas' | 'tecnico' | 'user'
export type SensitivityLevel = 'public' | 'internal' | 'confidential' | 'restricted'

export interface PermissionCheck {
  allowed: boolean
  reason?: string
  requiredRole?: string
  requiredLevel?: string
}

export class ThomazPermissionsService {
  /**
   * Hierarquia de roles (maior = mais permissões)
   */
  private roleHierarchy: Record<UserRole, number> = {
    admin: 100,
    gestor: 80,
    financeiro: 60,
    vendas: 40,
    tecnico: 30,
    user: 10
  }

  /**
   * Hierarquia de sensitivity (maior = mais restrito)
   */
  private sensitivityHierarchy: Record<SensitivityLevel, number> = {
    public: 0,
    internal: 25,
    confidential: 50,
    restricted: 100
  }

  /**
   * Mapeamento de sensitivity para roles permitidos
   */
  private sensitivityToRoles: Record<SensitivityLevel, UserRole[]> = {
    public: ['admin', 'gestor', 'financeiro', 'vendas', 'tecnico', 'user'],
    internal: ['admin', 'gestor', 'financeiro', 'vendas', 'tecnico'],
    confidential: ['admin', 'gestor', 'financeiro'],
    restricted: ['admin']
  }

  /**
   * Verificar se usuário tem acesso a documento
   */
  canAccessDocument(
    userRole: string,
    documentSensitivity: string,
    documentRequiredRoles?: string[]
  ): PermissionCheck {
    const role = userRole as UserRole
    const sensitivity = documentSensitivity as SensitivityLevel

    // Verificar se role é válido
    if (!this.roleHierarchy[role]) {
      return {
        allowed: false,
        reason: 'Role de usuário inválido'
      }
    }

    // Verificar sensitivity level
    const allowedRoles = this.sensitivityToRoles[sensitivity] || []
    if (!allowedRoles.includes(role)) {
      return {
        allowed: false,
        reason: `Acesso negado: documento ${sensitivity} requer role mínimo de ${allowedRoles[allowedRoles.length - 1]}`,
        requiredLevel: sensitivity
      }
    }

    // Verificar required_roles específicos do documento
    if (documentRequiredRoles && documentRequiredRoles.length > 0) {
      if (!documentRequiredRoles.includes(role)) {
        // Verificar se algum role requerido está abaixo na hierarquia
        const userLevel = this.roleHierarchy[role]
        const hasHigherRole = documentRequiredRoles.some(
          reqRole => this.roleHierarchy[reqRole as UserRole] <= userLevel
        )

        if (!hasHigherRole) {
          return {
            allowed: false,
            reason: `Acesso negado: documento requer um dos roles: ${documentRequiredRoles.join(', ')}`,
            requiredRole: documentRequiredRoles[0]
          }
        }
      }
    }

    return {
      allowed: true
    }
  }

  /**
   * Filtrar documentos por permissões
   */
  filterDocumentsByPermission(
    documents: any[],
    userRole: string
  ): any[] {
    return documents.filter(doc => {
      const check = this.canAccessDocument(
        userRole,
        doc.sensitivity || 'public',
        doc.required_roles
      )
      return check.allowed
    })
  }

  /**
   * Verificar se action requer 2FA
   */
  requires2FA(action: string, dataImpact: 'low' | 'medium' | 'high'): boolean {
    const highImpactActions = [
      'delete_order',
      'cancel_invoice',
      'modify_payment',
      'change_permissions',
      'export_sensitive_data'
    ]

    const mediumImpactActions = [
      'create_order',
      'approve_budget',
      'update_inventory'
    ]

    if (dataImpact === 'high' || highImpactActions.includes(action)) {
      return true
    }

    if (dataImpact === 'medium' && mediumImpactActions.includes(action)) {
      return true
    }

    return false
  }

  /**
   * Verificar se usuário pode executar ação
   */
  canPerformAction(
    userRole: string,
    action: string,
    resourceType: string
  ): PermissionCheck {
    const role = userRole as UserRole

    // Mapa de ações por resource type
    const actionPermissions: Record<string, Record<string, UserRole[]>> = {
      financial: {
        view: ['admin', 'gestor', 'financeiro'],
        create: ['admin', 'gestor', 'financeiro'],
        update: ['admin', 'gestor', 'financeiro'],
        delete: ['admin', 'gestor']
      },
      orders: {
        view: ['admin', 'gestor', 'financeiro', 'vendas', 'tecnico'],
        create: ['admin', 'gestor', 'vendas'],
        update: ['admin', 'gestor', 'vendas'],
        delete: ['admin', 'gestor']
      },
      inventory: {
        view: ['admin', 'gestor', 'financeiro', 'tecnico'],
        create: ['admin', 'gestor'],
        update: ['admin', 'gestor', 'tecnico'],
        delete: ['admin', 'gestor']
      },
      reports: {
        view: ['admin', 'gestor', 'financeiro'],
        create: ['admin', 'gestor'],
        export: ['admin', 'gestor', 'financeiro']
      },
      users: {
        view: ['admin', 'gestor'],
        create: ['admin'],
        update: ['admin'],
        delete: ['admin']
      }
    }

    const resourcePermissions = actionPermissions[resourceType]
    if (!resourcePermissions) {
      return {
        allowed: false,
        reason: `Tipo de recurso inválido: ${resourceType}`
      }
    }

    const allowedRoles = resourcePermissions[action]
    if (!allowedRoles) {
      return {
        allowed: false,
        reason: `Ação inválida: ${action}`
      }
    }

    if (!allowedRoles.includes(role)) {
      return {
        allowed: false,
        reason: `Permissão negada: ${action} em ${resourceType} requer role: ${allowedRoles.join(' ou ')}`,
        requiredRole: allowedRoles[0]
      }
    }

    return {
      allowed: true
    }
  }

  /**
   * Obter nível de acesso do usuário
   */
  getUserAccessLevel(userRole: string): number {
    return this.roleHierarchy[userRole as UserRole] || 0
  }

  /**
   * Verificar se role A pode acessar dados de role B
   */
  canAccessRoleData(roleA: string, roleB: string): boolean {
    const levelA = this.getUserAccessLevel(roleA)
    const levelB = this.getUserAccessLevel(roleB)

    return levelA >= levelB
  }

  /**
   * Mascarar dados sensíveis se usuário não tiver permissão
   */
  maskSensitiveData(data: any, userRole: string, fields: string[]): any {
    const isAdmin = userRole === 'admin'
    const isGestor = userRole === 'gestor'

    if (isAdmin || isGestor) {
      return data // Sem máscara para admin/gestor
    }

    const masked = { ...data }

    for (const field of fields) {
      if (masked[field]) {
        if (typeof masked[field] === 'string') {
          masked[field] = '***'
        } else if (typeof masked[field] === 'number') {
          masked[field] = 0
        }
      }
    }

    return masked
  }
}
