import React from 'react'
import { motion } from 'framer-motion'
import { Code, Smartphone, Globe, Database, Shield, Zap, ArrowRight } from 'lucide-react'

const Services = () => {
  const services = [
    {
      icon: Code,
      title: 'Desenvolvimento Web',
      description: 'Criamos sites e aplicações web modernas, responsivas e otimizadas.',
      features: ['React/Next.js', 'Vue.js/Nuxt.js', 'Node.js/Express', 'TypeScript'],
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Smartphone,
      title: 'Desenvolvimento Mobile',
      description: 'Apps nativos e híbridos para iOS e Android com performance superior.',
      features: ['React Native', 'Flutter', 'Swift/Kotlin', 'Ionic'],
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Globe,
      title: 'Soluções Cloud',
      description: 'Infraestrutura escalável e segura na nuvem para seu negócio.',
      features: ['AWS/Azure', 'Docker/Kubernetes', 'CI/CD', 'Microserviços'],
      color: 'from-green-500 to-teal-500'
    },
    {
      icon: Database,
      title: 'Banco de Dados',
      description: 'Design e otimização de bancos de dados para máxima performance.',
      features: ['PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch'],
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Shield,
      title: 'Segurança Digital',
      description: 'Implementação de medidas de segurança robustas e auditoria.',
      features: ['Pentesting', 'LGPD/GDPR', 'SSL/TLS', 'Firewall'],
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: Zap,
      title: 'Otimização',
      description: 'Melhoria de performance e otimização de aplicações existentes.',
      features: ['Performance', 'SEO', 'Core Web Vitals', 'Monitoring'],
      color: 'from-yellow-500 to-orange-500'
    }
  ]

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="py-20 gradient-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Nossos <span className="text-accent-300">Serviços</span>
            </h1>
            <p className="text-xl text-gray-200 max-w-3xl mx-auto">
              Oferecemos soluções tecnológicas completas para transformar sua visão em realidade digital
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card p-8 group hover:-translate-y-2 relative overflow-hidden"
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${service.color} rounded-full mb-6`}>
                    <service.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{service.title}</h3>
                  <p className="text-gray-600 mb-6">{service.description}</p>
                  
                  <div className="space-y-2 mb-6">
                    {service.features.map((feature) => (
                      <div key={feature} className="flex items-center text-sm text-gray-500">
                        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-2"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <button className="flex items-center text-primary-600 font-medium group-hover:text-primary-700 transition-colors duration-200">
                    Saiba mais
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nosso Processo
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Uma metodologia comprovada para entregar resultados excepcionais
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Descoberta',
                description: 'Entendemos suas necessidades e objetivos de negócio.'
              },
              {
                step: '02',
                title: 'Planejamento',
                description: 'Criamos uma estratégia detalhada e cronograma do projeto.'
              },
              {
                step: '03',
                title: 'Desenvolvimento',
                description: 'Implementamos a solução com as melhores práticas.'
              },
              {
                step: '04',
                title: 'Entrega',
                description: 'Testamos, otimizamos e entregamos o projeto finalizado.'
              }
            ].map((process, index) => (
              <motion.div
                key={process.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-full text-xl font-bold mb-4">
                  {process.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{process.title}</h3>
                <p className="text-gray-600">{process.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Pronto para começar seu projeto?
            </h2>
            <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
              Entre em contato conosco e vamos discutir como podemos ajudar a transformar sua ideia em realidade
            </p>
            <button className="btn-primary inline-flex items-center">
              Solicitar Orçamento
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Services