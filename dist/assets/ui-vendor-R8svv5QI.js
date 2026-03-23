import{r as x,R as us}from"./react-vendor-Cj8EIpcp.js";const ds=x.createContext({transformPagePoint:t=>t,isStatic:!1,reducedMotion:"never"}),Jt=x.createContext({}),te=x.createContext(null),ee=typeof document<"u",Be=ee?x.useLayoutEffect:x.useEffect,ys=x.createContext({strict:!1}),Fe=t=>t.replace(/([a-z])([A-Z])/g,"$1-$2").toLowerCase(),Fi="framerAppearId",fs="data-"+Fe(Fi);function Ei(t,e,n,s){const{visualElement:i}=x.useContext(Jt),o=x.useContext(ys),r=x.useContext(te),a=x.useContext(ds).reducedMotion,c=x.useRef();s=s||o.renderer,!c.current&&s&&(c.current=s(t,{visualState:e,parent:i,props:n,presenceContext:r,blockInitialAnimation:r?r.initial===!1:!1,reducedMotionConfig:a}));const l=c.current;x.useInsertionEffect(()=>{l&&l.update(n,r)});const h=x.useRef(!!(n[fs]&&!window.HandoffComplete));return Be(()=>{l&&(l.render(),h.current&&l.animationState&&l.animationState.animateChanges())}),x.useEffect(()=>{l&&(l.updateFeatures(),!h.current&&l.animationState&&l.animationState.animateChanges(),h.current&&(h.current=!1,window.HandoffComplete=!0))}),l}function pt(t){return t&&typeof t=="object"&&Object.prototype.hasOwnProperty.call(t,"current")}function zi(t,e,n){return x.useCallback(s=>{s&&t.mount&&t.mount(s),e&&(s?e.mount(s):e.unmount()),n&&(typeof n=="function"?n(s):pt(n)&&(n.current=s))},[e])}function Dt(t){return typeof t=="string"||Array.isArray(t)}function ne(t){return t!==null&&typeof t=="object"&&typeof t.start=="function"}const Ee=["animate","whileInView","whileFocus","whileHover","whileTap","whileDrag","exit"],ze=["initial",...Ee];function se(t){return ne(t.animate)||ze.some(e=>Dt(t[e]))}function ps(t){return!!(se(t)||t.variants)}function Oi(t,e){if(se(t)){const{initial:n,animate:s}=t;return{initial:n===!1||Dt(n)?n:void 0,animate:Dt(s)?s:void 0}}return t.inherit!==!1?e:{}}function Hi(t){const{initial:e,animate:n}=Oi(t,x.useContext(Jt));return x.useMemo(()=>({initial:e,animate:n}),[cn(e),cn(n)])}function cn(t){return Array.isArray(t)?t.join(" "):t}const ln={animation:["animate","variants","whileHover","whileTap","exit","whileInView","whileFocus","whileDrag"],exit:["exit"],drag:["drag","dragControls"],focus:["whileFocus"],hover:["whileHover","onHoverStart","onHoverEnd"],tap:["whileTap","onTap","onTapStart","onTapCancel"],pan:["onPan","onPanStart","onPanSessionStart","onPanEnd"],inView:["whileInView","onViewportEnter","onViewportLeave"],layout:["layout","layoutId"]},Rt={};for(const t in ln)Rt[t]={isEnabled:e=>ln[t].some(n=>!!e[n])};function qi(t){for(const e in t)Rt[e]={...Rt[e],...t[e]}}const Oe=x.createContext({}),ms=x.createContext({}),Ii=Symbol.for("motionComponentSymbol");function Ui({preloadedFeatures:t,createVisualElement:e,useRender:n,useVisualState:s,Component:i}){t&&qi(t);function o(a,c){let l;const h={...x.useContext(ds),...a,layoutId:Ni(a)},{isStatic:u}=h,y=Hi(a),f=s(a,u);if(!u&&ee){y.visualElement=Ei(i,f,h,e);const p=x.useContext(ms),m=x.useContext(ys).strict;y.visualElement&&(l=y.visualElement.loadFeatures(h,m,t,p))}return x.createElement(Jt.Provider,{value:y},l&&y.visualElement?x.createElement(l,{visualElement:y.visualElement,...h}):null,n(i,a,zi(f,y.visualElement,c),f,u,y.visualElement))}const r=x.forwardRef(o);return r[Ii]=i,r}function Ni({layoutId:t}){const e=x.useContext(Oe).id;return e&&t!==void 0?e+"-"+t:t}function Wi(t){function e(s,i={}){return Ui(t(s,i))}if(typeof Proxy>"u")return e;const n=new Map;return new Proxy(e,{get:(s,i)=>(n.has(i)||n.set(i,e(i)),n.get(i))})}const Gi=["animate","circle","defs","desc","ellipse","g","image","line","filter","marker","mask","metadata","path","pattern","polygon","polyline","rect","stop","switch","symbol","svg","text","tspan","use","view"];function He(t){return typeof t!="string"||t.includes("-")?!1:!!(Gi.indexOf(t)>-1||/[A-Z]/.test(t))}const Gt={};function Zi(t){Object.assign(Gt,t)}const Bt=["transformPerspective","x","y","z","translateX","translateY","translateZ","scale","scaleX","scaleY","rotate","rotateX","rotateY","rotateZ","skew","skewX","skewY"],ht=new Set(Bt);function gs(t,{layout:e,layoutId:n}){return ht.has(t)||t.startsWith("origin")||(e||n!==void 0)&&(!!Gt[t]||t==="opacity")}const O=t=>!!(t&&t.getVelocity),$i={x:"translateX",y:"translateY",z:"translateZ",transformPerspective:"perspective"},Ki=Bt.length;function _i(t,{enableHardwareAcceleration:e=!0,allowTransformNone:n=!0},s,i){let o="";for(let r=0;r<Ki;r++){const a=Bt[r];if(t[a]!==void 0){const c=$i[a]||a;o+=`${c}(${t[a]}) `}}return e&&!t.z&&(o+="translateZ(0)"),o=o.trim(),i?o=i(t,s?"":o):n&&s&&(o="none"),o}const xs=t=>e=>typeof e=="string"&&e.startsWith(t),ks=xs("--"),Me=xs("var(--"),Xi=/var\s*\(\s*--[\w-]+(\s*,\s*(?:(?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)+)?\s*\)/g,Yi=(t,e)=>e&&typeof t=="number"?e.transform(t):t,tt=(t,e,n)=>Math.min(Math.max(n,t),e),ut={test:t=>typeof t=="number",parse:parseFloat,transform:t=>t},Tt={...ut,transform:t=>tt(0,1,t)},Ht={...ut,default:1},St=t=>Math.round(t*1e5)/1e5,ie=/(-)?([\d]*\.?[\d])+/g,vs=/(#[0-9a-f]{3,8}|(rgb|hsl)a?\((-?[\d\.]+%?[,\s]+){2}(-?[\d\.]+%?)\s*[\,\/]?\s*[\d\.]*%?\))/gi,Qi=/^(#[0-9a-f]{3,8}|(rgb|hsl)a?\((-?[\d\.]+%?[,\s]+){2}(-?[\d\.]+%?)\s*[\,\/]?\s*[\d\.]*%?\))$/i;function Ft(t){return typeof t=="string"}const Et=t=>({test:e=>Ft(e)&&e.endsWith(t)&&e.split(" ").length===1,parse:parseFloat,transform:e=>`${e}${t}`}),Y=Et("deg"),W=Et("%"),w=Et("px"),Ji=Et("vh"),tr=Et("vw"),hn={...W,parse:t=>W.parse(t)/100,transform:t=>W.transform(t*100)},un={...ut,transform:Math.round},Ms={borderWidth:w,borderTopWidth:w,borderRightWidth:w,borderBottomWidth:w,borderLeftWidth:w,borderRadius:w,radius:w,borderTopLeftRadius:w,borderTopRightRadius:w,borderBottomRightRadius:w,borderBottomLeftRadius:w,width:w,maxWidth:w,height:w,maxHeight:w,size:w,top:w,right:w,bottom:w,left:w,padding:w,paddingTop:w,paddingRight:w,paddingBottom:w,paddingLeft:w,margin:w,marginTop:w,marginRight:w,marginBottom:w,marginLeft:w,rotate:Y,rotateX:Y,rotateY:Y,rotateZ:Y,scale:Ht,scaleX:Ht,scaleY:Ht,scaleZ:Ht,skew:Y,skewX:Y,skewY:Y,distance:w,translateX:w,translateY:w,translateZ:w,x:w,y:w,z:w,perspective:w,transformPerspective:w,opacity:Tt,originX:hn,originY:hn,originZ:w,zIndex:un,fillOpacity:Tt,strokeOpacity:Tt,numOctaves:un};function qe(t,e,n,s){const{style:i,vars:o,transform:r,transformOrigin:a}=t;let c=!1,l=!1,h=!0;for(const u in e){const y=e[u];if(ks(u)){o[u]=y;continue}const f=Ms[u],p=Yi(y,f);if(ht.has(u)){if(c=!0,r[u]=p,!h)continue;y!==(f.default||0)&&(h=!1)}else u.startsWith("origin")?(l=!0,a[u]=p):i[u]=p}if(e.transform||(c||s?i.transform=_i(t.transform,n,h,s):i.transform&&(i.transform="none")),l){const{originX:u="50%",originY:y="50%",originZ:f=0}=a;i.transformOrigin=`${u} ${y} ${f}`}}const Ie=()=>({style:{},transform:{},transformOrigin:{},vars:{}});function bs(t,e,n){for(const s in e)!O(e[s])&&!gs(s,n)&&(t[s]=e[s])}function er({transformTemplate:t},e,n){return x.useMemo(()=>{const s=Ie();return qe(s,e,{enableHardwareAcceleration:!n},t),Object.assign({},s.vars,s.style)},[e])}function nr(t,e,n){const s=t.style||{},i={};return bs(i,s,t),Object.assign(i,er(t,e,n)),t.transformValues?t.transformValues(i):i}function sr(t,e,n){const s={},i=nr(t,e,n);return t.drag&&t.dragListener!==!1&&(s.draggable=!1,i.userSelect=i.WebkitUserSelect=i.WebkitTouchCallout="none",i.touchAction=t.drag===!0?"none":`pan-${t.drag==="x"?"y":"x"}`),t.tabIndex===void 0&&(t.onTap||t.onTapStart||t.whileTap)&&(s.tabIndex=0),s.style=i,s}const ir=new Set(["animate","exit","variants","initial","style","values","variants","transition","transformTemplate","transformValues","custom","inherit","onBeforeLayoutMeasure","onAnimationStart","onAnimationComplete","onUpdate","onDragStart","onDrag","onDragEnd","onMeasureDragConstraints","onDirectionLock","onDragTransitionEnd","_dragX","_dragY","onHoverStart","onHoverEnd","onViewportEnter","onViewportLeave","globalTapTarget","ignoreStrict","viewport"]);function Zt(t){return t.startsWith("while")||t.startsWith("drag")&&t!=="draggable"||t.startsWith("layout")||t.startsWith("onTap")||t.startsWith("onPan")||t.startsWith("onLayout")||ir.has(t)}let ws=t=>!Zt(t);function rr(t){t&&(ws=e=>e.startsWith("on")?!Zt(e):t(e))}try{rr(require("@emotion/is-prop-valid").default)}catch{}function or(t,e,n){const s={};for(const i in t)i==="values"&&typeof t.values=="object"||(ws(i)||n===!0&&Zt(i)||!e&&!Zt(i)||t.draggable&&i.startsWith("onDrag"))&&(s[i]=t[i]);return s}function dn(t,e,n){return typeof t=="string"?t:w.transform(e+n*t)}function ar(t,e,n){const s=dn(e,t.x,t.width),i=dn(n,t.y,t.height);return`${s} ${i}`}const cr={offset:"stroke-dashoffset",array:"stroke-dasharray"},lr={offset:"strokeDashoffset",array:"strokeDasharray"};function hr(t,e,n=1,s=0,i=!0){t.pathLength=1;const o=i?cr:lr;t[o.offset]=w.transform(-s);const r=w.transform(e),a=w.transform(n);t[o.array]=`${r} ${a}`}function Ue(t,{attrX:e,attrY:n,attrScale:s,originX:i,originY:o,pathLength:r,pathSpacing:a=1,pathOffset:c=0,...l},h,u,y){if(qe(t,l,h,y),u){t.style.viewBox&&(t.attrs.viewBox=t.style.viewBox);return}t.attrs=t.style,t.style={};const{attrs:f,style:p,dimensions:m}=t;f.transform&&(m&&(p.transform=f.transform),delete f.transform),m&&(i!==void 0||o!==void 0||p.transform)&&(p.transformOrigin=ar(m,i!==void 0?i:.5,o!==void 0?o:.5)),e!==void 0&&(f.x=e),n!==void 0&&(f.y=n),s!==void 0&&(f.scale=s),r!==void 0&&hr(f,r,a,c,!1)}const Ps=()=>({...Ie(),attrs:{}}),Ne=t=>typeof t=="string"&&t.toLowerCase()==="svg";function ur(t,e,n,s){const i=x.useMemo(()=>{const o=Ps();return Ue(o,e,{enableHardwareAcceleration:!1},Ne(s),t.transformTemplate),{...o.attrs,style:{...o.style}}},[e]);if(t.style){const o={};bs(o,t.style,t),i.style={...o,...i.style}}return i}function dr(t=!1){return(n,s,i,{latestValues:o},r)=>{const c=(He(n)?ur:sr)(s,o,r,n),h={...or(s,typeof n=="string",t),...c,ref:i},{children:u}=s,y=x.useMemo(()=>O(u)?u.get():u,[u]);return x.createElement(n,{...h,children:y})}}function Vs(t,{style:e,vars:n},s,i){Object.assign(t.style,e,i&&i.getProjectionStyles(s));for(const o in n)t.style.setProperty(o,n[o])}const Cs=new Set(["baseFrequency","diffuseConstant","kernelMatrix","kernelUnitLength","keySplines","keyTimes","limitingConeAngle","markerHeight","markerWidth","numOctaves","targetX","targetY","surfaceScale","specularConstant","specularExponent","stdDeviation","tableValues","viewBox","gradientTransform","pathLength","startOffset","textLength","lengthAdjust"]);function Ts(t,e,n,s){Vs(t,e,void 0,s);for(const i in e.attrs)t.setAttribute(Cs.has(i)?i:Fe(i),e.attrs[i])}function We(t,e){const{style:n}=t,s={};for(const i in n)(O(n[i])||e.style&&O(e.style[i])||gs(i,t))&&(s[i]=n[i]);return s}function Ss(t,e){const n=We(t,e);for(const s in t)if(O(t[s])||O(e[s])){const i=Bt.indexOf(s)!==-1?"attr"+s.charAt(0).toUpperCase()+s.substring(1):s;n[i]=t[s]}return n}function Ge(t,e,n,s={},i={}){return typeof e=="function"&&(e=e(n!==void 0?n:t.custom,s,i)),typeof e=="string"&&(e=t.variants&&t.variants[e]),typeof e=="function"&&(e=e(n!==void 0?n:t.custom,s,i)),e}function As(t){const e=x.useRef(null);return e.current===null&&(e.current=t()),e.current}const $t=t=>Array.isArray(t),yr=t=>!!(t&&typeof t=="object"&&t.mix&&t.toValue),fr=t=>$t(t)?t[t.length-1]||0:t;function Nt(t){const e=O(t)?t.get():t;return yr(e)?e.toValue():e}function pr({scrapeMotionValuesFromProps:t,createRenderState:e,onMount:n},s,i,o){const r={latestValues:mr(s,i,o,t),renderState:e()};return n&&(r.mount=a=>n(s,a,r)),r}const Ls=t=>(e,n)=>{const s=x.useContext(Jt),i=x.useContext(te),o=()=>pr(t,e,s,i);return n?o():As(o)};function mr(t,e,n,s){const i={},o=s(t,{});for(const y in o)i[y]=Nt(o[y]);let{initial:r,animate:a}=t;const c=se(t),l=ps(t);e&&l&&!c&&t.inherit!==!1&&(r===void 0&&(r=e.initial),a===void 0&&(a=e.animate));let h=n?n.initial===!1:!1;h=h||r===!1;const u=h?a:r;return u&&typeof u!="boolean"&&!ne(u)&&(Array.isArray(u)?u:[u]).forEach(f=>{const p=Ge(t,f);if(!p)return;const{transitionEnd:m,transition:v,...b}=p;for(const k in b){let g=b[k];if(Array.isArray(g)){const M=h?g.length-1:0;g=g[M]}g!==null&&(i[k]=g)}for(const k in m)i[k]=m[k]}),i}const R=t=>t;class yn{constructor(){this.order=[],this.scheduled=new Set}add(e){if(!this.scheduled.has(e))return this.scheduled.add(e),this.order.push(e),!0}remove(e){const n=this.order.indexOf(e);n!==-1&&(this.order.splice(n,1),this.scheduled.delete(e))}clear(){this.order.length=0,this.scheduled.clear()}}function gr(t){let e=new yn,n=new yn,s=0,i=!1,o=!1;const r=new WeakSet,a={schedule:(c,l=!1,h=!1)=>{const u=h&&i,y=u?e:n;return l&&r.add(c),y.add(c)&&u&&i&&(s=e.order.length),c},cancel:c=>{n.remove(c),r.delete(c)},process:c=>{if(i){o=!0;return}if(i=!0,[e,n]=[n,e],n.clear(),s=e.order.length,s)for(let l=0;l<s;l++){const h=e.order[l];h(c),r.has(h)&&(a.schedule(h),t())}i=!1,o&&(o=!1,a.process(c))}};return a}const qt=["prepare","read","update","preRender","render","postRender"],xr=40;function kr(t,e){let n=!1,s=!0;const i={delta:0,timestamp:0,isProcessing:!1},o=qt.reduce((u,y)=>(u[y]=gr(()=>n=!0),u),{}),r=u=>o[u].process(i),a=()=>{const u=performance.now();n=!1,i.delta=s?1e3/60:Math.max(Math.min(u-i.timestamp,xr),1),i.timestamp=u,i.isProcessing=!0,qt.forEach(r),i.isProcessing=!1,n&&e&&(s=!1,t(a))},c=()=>{n=!0,s=!0,i.isProcessing||t(a)};return{schedule:qt.reduce((u,y)=>{const f=o[y];return u[y]=(p,m=!1,v=!1)=>(n||c(),f.schedule(p,m,v)),u},{}),cancel:u=>qt.forEach(y=>o[y].cancel(u)),state:i,steps:o}}const{schedule:T,cancel:_,state:F,steps:ce}=kr(typeof requestAnimationFrame<"u"?requestAnimationFrame:R,!0),vr={useVisualState:Ls({scrapeMotionValuesFromProps:Ss,createRenderState:Ps,onMount:(t,e,{renderState:n,latestValues:s})=>{T.read(()=>{try{n.dimensions=typeof e.getBBox=="function"?e.getBBox():e.getBoundingClientRect()}catch{n.dimensions={x:0,y:0,width:0,height:0}}}),T.render(()=>{Ue(n,s,{enableHardwareAcceleration:!1},Ne(e.tagName),t.transformTemplate),Ts(e,n)})}})},Mr={useVisualState:Ls({scrapeMotionValuesFromProps:We,createRenderState:Ie})};function br(t,{forwardMotionProps:e=!1},n,s){return{...He(t)?vr:Mr,preloadedFeatures:n,useRender:dr(e),createVisualElement:s,Component:t}}function Z(t,e,n,s={passive:!0}){return t.addEventListener(e,n,s),()=>t.removeEventListener(e,n)}const Ds=t=>t.pointerType==="mouse"?typeof t.button!="number"||t.button<=0:t.isPrimary!==!1;function re(t,e="page"){return{point:{x:t[e+"X"],y:t[e+"Y"]}}}const wr=t=>e=>Ds(e)&&t(e,re(e));function $(t,e,n,s){return Z(t,e,wr(n),s)}const Pr=(t,e)=>n=>e(t(n)),J=(...t)=>t.reduce(Pr);function Rs(t){let e=null;return()=>{const n=()=>{e=null};return e===null?(e=t,n):!1}}const fn=Rs("dragHorizontal"),pn=Rs("dragVertical");function js(t){let e=!1;if(t==="y")e=pn();else if(t==="x")e=fn();else{const n=fn(),s=pn();n&&s?e=()=>{n(),s()}:(n&&n(),s&&s())}return e}function Bs(){const t=js(!0);return t?(t(),!1):!0}class nt{constructor(e){this.isMounted=!1,this.node=e}update(){}}function mn(t,e){const n="pointer"+(e?"enter":"leave"),s="onHover"+(e?"Start":"End"),i=(o,r)=>{if(o.pointerType==="touch"||Bs())return;const a=t.getProps();t.animationState&&a.whileHover&&t.animationState.setActive("whileHover",e),a[s]&&T.update(()=>a[s](o,r))};return $(t.current,n,i,{passive:!t.getProps()[s]})}class Vr extends nt{mount(){this.unmount=J(mn(this.node,!0),mn(this.node,!1))}unmount(){}}class Cr extends nt{constructor(){super(...arguments),this.isActive=!1}onFocus(){let e=!1;try{e=this.node.current.matches(":focus-visible")}catch{e=!0}!e||!this.node.animationState||(this.node.animationState.setActive("whileFocus",!0),this.isActive=!0)}onBlur(){!this.isActive||!this.node.animationState||(this.node.animationState.setActive("whileFocus",!1),this.isActive=!1)}mount(){this.unmount=J(Z(this.node.current,"focus",()=>this.onFocus()),Z(this.node.current,"blur",()=>this.onBlur()))}unmount(){}}const Fs=(t,e)=>e?t===e?!0:Fs(t,e.parentElement):!1;function le(t,e){if(!e)return;const n=new PointerEvent("pointer"+t);e(n,re(n))}class Tr extends nt{constructor(){super(...arguments),this.removeStartListeners=R,this.removeEndListeners=R,this.removeAccessibleListeners=R,this.startPointerPress=(e,n)=>{if(this.isPressing)return;this.removeEndListeners();const s=this.node.getProps(),o=$(window,"pointerup",(a,c)=>{if(!this.checkPressEnd())return;const{onTap:l,onTapCancel:h,globalTapTarget:u}=this.node.getProps();T.update(()=>{!u&&!Fs(this.node.current,a.target)?h&&h(a,c):l&&l(a,c)})},{passive:!(s.onTap||s.onPointerUp)}),r=$(window,"pointercancel",(a,c)=>this.cancelPress(a,c),{passive:!(s.onTapCancel||s.onPointerCancel)});this.removeEndListeners=J(o,r),this.startPress(e,n)},this.startAccessiblePress=()=>{const e=o=>{if(o.key!=="Enter"||this.isPressing)return;const r=a=>{a.key!=="Enter"||!this.checkPressEnd()||le("up",(c,l)=>{const{onTap:h}=this.node.getProps();h&&T.update(()=>h(c,l))})};this.removeEndListeners(),this.removeEndListeners=Z(this.node.current,"keyup",r),le("down",(a,c)=>{this.startPress(a,c)})},n=Z(this.node.current,"keydown",e),s=()=>{this.isPressing&&le("cancel",(o,r)=>this.cancelPress(o,r))},i=Z(this.node.current,"blur",s);this.removeAccessibleListeners=J(n,i)}}startPress(e,n){this.isPressing=!0;const{onTapStart:s,whileTap:i}=this.node.getProps();i&&this.node.animationState&&this.node.animationState.setActive("whileTap",!0),s&&T.update(()=>s(e,n))}checkPressEnd(){return this.removeEndListeners(),this.isPressing=!1,this.node.getProps().whileTap&&this.node.animationState&&this.node.animationState.setActive("whileTap",!1),!Bs()}cancelPress(e,n){if(!this.checkPressEnd())return;const{onTapCancel:s}=this.node.getProps();s&&T.update(()=>s(e,n))}mount(){const e=this.node.getProps(),n=$(e.globalTapTarget?window:this.node.current,"pointerdown",this.startPointerPress,{passive:!(e.onTapStart||e.onPointerStart)}),s=Z(this.node.current,"focus",this.startAccessiblePress);this.removeStartListeners=J(n,s)}unmount(){this.removeStartListeners(),this.removeEndListeners(),this.removeAccessibleListeners()}}const be=new WeakMap,he=new WeakMap,Sr=t=>{const e=be.get(t.target);e&&e(t)},Ar=t=>{t.forEach(Sr)};function Lr({root:t,...e}){const n=t||document;he.has(n)||he.set(n,{});const s=he.get(n),i=JSON.stringify(e);return s[i]||(s[i]=new IntersectionObserver(Ar,{root:t,...e})),s[i]}function Dr(t,e,n){const s=Lr(e);return be.set(t,n),s.observe(t),()=>{be.delete(t),s.unobserve(t)}}const Rr={some:0,all:1};class jr extends nt{constructor(){super(...arguments),this.hasEnteredView=!1,this.isInView=!1}startObserver(){this.unmount();const{viewport:e={}}=this.node.getProps(),{root:n,margin:s,amount:i="some",once:o}=e,r={root:n?n.current:void 0,rootMargin:s,threshold:typeof i=="number"?i:Rr[i]},a=c=>{const{isIntersecting:l}=c;if(this.isInView===l||(this.isInView=l,o&&!l&&this.hasEnteredView))return;l&&(this.hasEnteredView=!0),this.node.animationState&&this.node.animationState.setActive("whileInView",l);const{onViewportEnter:h,onViewportLeave:u}=this.node.getProps(),y=l?h:u;y&&y(c)};return Dr(this.node.current,r,a)}mount(){this.startObserver()}update(){if(typeof IntersectionObserver>"u")return;const{props:e,prevProps:n}=this.node;["amount","margin","root"].some(Br(e,n))&&this.startObserver()}unmount(){}}function Br({viewport:t={}},{viewport:e={}}={}){return n=>t[n]!==e[n]}const Fr={inView:{Feature:jr},tap:{Feature:Tr},focus:{Feature:Cr},hover:{Feature:Vr}};function Es(t,e){if(!Array.isArray(e))return!1;const n=e.length;if(n!==t.length)return!1;for(let s=0;s<n;s++)if(e[s]!==t[s])return!1;return!0}function Er(t){const e={};return t.values.forEach((n,s)=>e[s]=n.get()),e}function zr(t){const e={};return t.values.forEach((n,s)=>e[s]=n.getVelocity()),e}function oe(t,e,n){const s=t.getProps();return Ge(s,e,n!==void 0?n:s.custom,Er(t),zr(t))}let Ze=R;const lt=t=>t*1e3,K=t=>t/1e3,Or={current:!1},zs=t=>Array.isArray(t)&&typeof t[0]=="number";function Os(t){return!!(!t||typeof t=="string"&&Hs[t]||zs(t)||Array.isArray(t)&&t.every(Os))}const Ct=([t,e,n,s])=>`cubic-bezier(${t}, ${e}, ${n}, ${s})`,Hs={linear:"linear",ease:"ease",easeIn:"ease-in",easeOut:"ease-out",easeInOut:"ease-in-out",circIn:Ct([0,.65,.55,1]),circOut:Ct([.55,0,1,.45]),backIn:Ct([.31,.01,.66,-.59]),backOut:Ct([.33,1.53,.69,.99])};function qs(t){if(t)return zs(t)?Ct(t):Array.isArray(t)?t.map(qs):Hs[t]}function Hr(t,e,n,{delay:s=0,duration:i,repeat:o=0,repeatType:r="loop",ease:a,times:c}={}){const l={[e]:n};c&&(l.offset=c);const h=qs(a);return Array.isArray(h)&&(l.easing=h),t.animate(l,{delay:s,duration:i,easing:Array.isArray(h)?"linear":h,fill:"both",iterations:o+1,direction:r==="reverse"?"alternate":"normal"})}function qr(t,{repeat:e,repeatType:n="loop"}){const s=e&&n!=="loop"&&e%2===1?0:t.length-1;return t[s]}const Is=(t,e,n)=>(((1-3*n+3*e)*t+(3*n-6*e))*t+3*e)*t,Ir=1e-7,Ur=12;function Nr(t,e,n,s,i){let o,r,a=0;do r=e+(n-e)/2,o=Is(r,s,i)-t,o>0?n=r:e=r;while(Math.abs(o)>Ir&&++a<Ur);return r}function zt(t,e,n,s){if(t===e&&n===s)return R;const i=o=>Nr(o,0,1,t,n);return o=>o===0||o===1?o:Is(i(o),e,s)}const Wr=zt(.42,0,1,1),Gr=zt(0,0,.58,1),Us=zt(.42,0,.58,1),Zr=t=>Array.isArray(t)&&typeof t[0]!="number",Ns=t=>e=>e<=.5?t(2*e)/2:(2-t(2*(1-e)))/2,Ws=t=>e=>1-t(1-e),$e=t=>1-Math.sin(Math.acos(t)),Gs=Ws($e),$r=Ns($e),Zs=zt(.33,1.53,.69,.99),Ke=Ws(Zs),Kr=Ns(Ke),_r=t=>(t*=2)<1?.5*Ke(t):.5*(2-Math.pow(2,-10*(t-1))),Xr={linear:R,easeIn:Wr,easeInOut:Us,easeOut:Gr,circIn:$e,circInOut:$r,circOut:Gs,backIn:Ke,backInOut:Kr,backOut:Zs,anticipate:_r},gn=t=>{if(Array.isArray(t)){Ze(t.length===4);const[e,n,s,i]=t;return zt(e,n,s,i)}else if(typeof t=="string")return Xr[t];return t},_e=(t,e)=>n=>!!(Ft(n)&&Qi.test(n)&&n.startsWith(t)||e&&Object.prototype.hasOwnProperty.call(n,e)),$s=(t,e,n)=>s=>{if(!Ft(s))return s;const[i,o,r,a]=s.match(ie);return{[t]:parseFloat(i),[e]:parseFloat(o),[n]:parseFloat(r),alpha:a!==void 0?parseFloat(a):1}},Yr=t=>tt(0,255,t),ue={...ut,transform:t=>Math.round(Yr(t))},ct={test:_e("rgb","red"),parse:$s("red","green","blue"),transform:({red:t,green:e,blue:n,alpha:s=1})=>"rgba("+ue.transform(t)+", "+ue.transform(e)+", "+ue.transform(n)+", "+St(Tt.transform(s))+")"};function Qr(t){let e="",n="",s="",i="";return t.length>5?(e=t.substring(1,3),n=t.substring(3,5),s=t.substring(5,7),i=t.substring(7,9)):(e=t.substring(1,2),n=t.substring(2,3),s=t.substring(3,4),i=t.substring(4,5),e+=e,n+=n,s+=s,i+=i),{red:parseInt(e,16),green:parseInt(n,16),blue:parseInt(s,16),alpha:i?parseInt(i,16)/255:1}}const we={test:_e("#"),parse:Qr,transform:ct.transform},mt={test:_e("hsl","hue"),parse:$s("hue","saturation","lightness"),transform:({hue:t,saturation:e,lightness:n,alpha:s=1})=>"hsla("+Math.round(t)+", "+W.transform(St(e))+", "+W.transform(St(n))+", "+St(Tt.transform(s))+")"},z={test:t=>ct.test(t)||we.test(t)||mt.test(t),parse:t=>ct.test(t)?ct.parse(t):mt.test(t)?mt.parse(t):we.parse(t),transform:t=>Ft(t)?t:t.hasOwnProperty("red")?ct.transform(t):mt.transform(t)},D=(t,e,n)=>-n*t+n*e+t;function de(t,e,n){return n<0&&(n+=1),n>1&&(n-=1),n<1/6?t+(e-t)*6*n:n<1/2?e:n<2/3?t+(e-t)*(2/3-n)*6:t}function Jr({hue:t,saturation:e,lightness:n,alpha:s}){t/=360,e/=100,n/=100;let i=0,o=0,r=0;if(!e)i=o=r=n;else{const a=n<.5?n*(1+e):n+e-n*e,c=2*n-a;i=de(c,a,t+1/3),o=de(c,a,t),r=de(c,a,t-1/3)}return{red:Math.round(i*255),green:Math.round(o*255),blue:Math.round(r*255),alpha:s}}const ye=(t,e,n)=>{const s=t*t;return Math.sqrt(Math.max(0,n*(e*e-s)+s))},to=[we,ct,mt],eo=t=>to.find(e=>e.test(t));function xn(t){const e=eo(t);let n=e.parse(t);return e===mt&&(n=Jr(n)),n}const Ks=(t,e)=>{const n=xn(t),s=xn(e),i={...n};return o=>(i.red=ye(n.red,s.red,o),i.green=ye(n.green,s.green,o),i.blue=ye(n.blue,s.blue,o),i.alpha=D(n.alpha,s.alpha,o),ct.transform(i))};function no(t){var e,n;return isNaN(t)&&Ft(t)&&(((e=t.match(ie))===null||e===void 0?void 0:e.length)||0)+(((n=t.match(vs))===null||n===void 0?void 0:n.length)||0)>0}const _s={regex:Xi,countKey:"Vars",token:"${v}",parse:R},Xs={regex:vs,countKey:"Colors",token:"${c}",parse:z.parse},Ys={regex:ie,countKey:"Numbers",token:"${n}",parse:ut.parse};function fe(t,{regex:e,countKey:n,token:s,parse:i}){const o=t.tokenised.match(e);o&&(t["num"+n]=o.length,t.tokenised=t.tokenised.replace(e,s),t.values.push(...o.map(i)))}function Kt(t){const e=t.toString(),n={value:e,tokenised:e,values:[],numVars:0,numColors:0,numNumbers:0};return n.value.includes("var(--")&&fe(n,_s),fe(n,Xs),fe(n,Ys),n}function Qs(t){return Kt(t).values}function Js(t){const{values:e,numColors:n,numVars:s,tokenised:i}=Kt(t),o=e.length;return r=>{let a=i;for(let c=0;c<o;c++)c<s?a=a.replace(_s.token,r[c]):c<s+n?a=a.replace(Xs.token,z.transform(r[c])):a=a.replace(Ys.token,St(r[c]));return a}}const so=t=>typeof t=="number"?0:t;function io(t){const e=Qs(t);return Js(t)(e.map(so))}const et={test:no,parse:Qs,createTransformer:Js,getAnimatableNone:io},ti=(t,e)=>n=>`${n>0?e:t}`;function ei(t,e){return typeof t=="number"?n=>D(t,e,n):z.test(t)?Ks(t,e):t.startsWith("var(")?ti(t,e):si(t,e)}const ni=(t,e)=>{const n=[...t],s=n.length,i=t.map((o,r)=>ei(o,e[r]));return o=>{for(let r=0;r<s;r++)n[r]=i[r](o);return n}},ro=(t,e)=>{const n={...t,...e},s={};for(const i in n)t[i]!==void 0&&e[i]!==void 0&&(s[i]=ei(t[i],e[i]));return i=>{for(const o in s)n[o]=s[o](i);return n}},si=(t,e)=>{const n=et.createTransformer(e),s=Kt(t),i=Kt(e);return s.numVars===i.numVars&&s.numColors===i.numColors&&s.numNumbers>=i.numNumbers?J(ni(s.values,i.values),n):ti(t,e)},jt=(t,e,n)=>{const s=e-t;return s===0?1:(n-t)/s},kn=(t,e)=>n=>D(t,e,n);function oo(t){return typeof t=="number"?kn:typeof t=="string"?z.test(t)?Ks:si:Array.isArray(t)?ni:typeof t=="object"?ro:kn}function ao(t,e,n){const s=[],i=n||oo(t[0]),o=t.length-1;for(let r=0;r<o;r++){let a=i(t[r],t[r+1]);if(e){const c=Array.isArray(e)?e[r]||R:e;a=J(c,a)}s.push(a)}return s}function ii(t,e,{clamp:n=!0,ease:s,mixer:i}={}){const o=t.length;if(Ze(o===e.length),o===1)return()=>e[0];t[0]>t[o-1]&&(t=[...t].reverse(),e=[...e].reverse());const r=ao(e,s,i),a=r.length,c=l=>{let h=0;if(a>1)for(;h<t.length-2&&!(l<t[h+1]);h++);const u=jt(t[h],t[h+1],l);return r[h](u)};return n?l=>c(tt(t[0],t[o-1],l)):c}function co(t,e){const n=t[t.length-1];for(let s=1;s<=e;s++){const i=jt(0,e,s);t.push(D(n,1,i))}}function lo(t){const e=[0];return co(e,t.length-1),e}function ho(t,e){return t.map(n=>n*e)}function uo(t,e){return t.map(()=>e||Us).splice(0,t.length-1)}function _t({duration:t=300,keyframes:e,times:n,ease:s="easeInOut"}){const i=Zr(s)?s.map(gn):gn(s),o={done:!1,value:e[0]},r=ho(n&&n.length===e.length?n:lo(e),t),a=ii(r,e,{ease:Array.isArray(i)?i:uo(e,i)});return{calculatedDuration:t,next:c=>(o.value=a(c),o.done=c>=t,o)}}function ri(t,e){return e?t*(1e3/e):0}const yo=5;function oi(t,e,n){const s=Math.max(e-yo,0);return ri(n-t(s),e-s)}const pe=.001,fo=.01,po=10,mo=.05,go=1;function xo({duration:t=800,bounce:e=.25,velocity:n=0,mass:s=1}){let i,o,r=1-e;r=tt(mo,go,r),t=tt(fo,po,K(t)),r<1?(i=l=>{const h=l*r,u=h*t,y=h-n,f=Pe(l,r),p=Math.exp(-u);return pe-y/f*p},o=l=>{const u=l*r*t,y=u*n+n,f=Math.pow(r,2)*Math.pow(l,2)*t,p=Math.exp(-u),m=Pe(Math.pow(l,2),r);return(-i(l)+pe>0?-1:1)*((y-f)*p)/m}):(i=l=>{const h=Math.exp(-l*t),u=(l-n)*t+1;return-pe+h*u},o=l=>{const h=Math.exp(-l*t),u=(n-l)*(t*t);return h*u});const a=5/t,c=vo(i,o,a);if(t=lt(t),isNaN(c))return{stiffness:100,damping:10,duration:t};{const l=Math.pow(c,2)*s;return{stiffness:l,damping:r*2*Math.sqrt(s*l),duration:t}}}const ko=12;function vo(t,e,n){let s=n;for(let i=1;i<ko;i++)s=s-t(s)/e(s);return s}function Pe(t,e){return t*Math.sqrt(1-e*e)}const Mo=["duration","bounce"],bo=["stiffness","damping","mass"];function vn(t,e){return e.some(n=>t[n]!==void 0)}function wo(t){let e={velocity:0,stiffness:100,damping:10,mass:1,isResolvedFromDuration:!1,...t};if(!vn(t,bo)&&vn(t,Mo)){const n=xo(t);e={...e,...n,mass:1},e.isResolvedFromDuration=!0}return e}function ai({keyframes:t,restDelta:e,restSpeed:n,...s}){const i=t[0],o=t[t.length-1],r={done:!1,value:i},{stiffness:a,damping:c,mass:l,duration:h,velocity:u,isResolvedFromDuration:y}=wo({...s,velocity:-K(s.velocity||0)}),f=u||0,p=c/(2*Math.sqrt(a*l)),m=o-i,v=K(Math.sqrt(a/l)),b=Math.abs(m)<5;n||(n=b?.01:2),e||(e=b?.005:.5);let k;if(p<1){const g=Pe(v,p);k=M=>{const P=Math.exp(-p*v*M);return o-P*((f+p*v*m)/g*Math.sin(g*M)+m*Math.cos(g*M))}}else if(p===1)k=g=>o-Math.exp(-v*g)*(m+(f+v*m)*g);else{const g=v*Math.sqrt(p*p-1);k=M=>{const P=Math.exp(-p*v*M),S=Math.min(g*M,300);return o-P*((f+p*v*m)*Math.sinh(S)+g*m*Math.cosh(S))/g}}return{calculatedDuration:y&&h||null,next:g=>{const M=k(g);if(y)r.done=g>=h;else{let P=f;g!==0&&(p<1?P=oi(k,g,M):P=0);const S=Math.abs(P)<=n,A=Math.abs(o-M)<=e;r.done=S&&A}return r.value=r.done?o:M,r}}}function Mn({keyframes:t,velocity:e=0,power:n=.8,timeConstant:s=325,bounceDamping:i=10,bounceStiffness:o=500,modifyTarget:r,min:a,max:c,restDelta:l=.5,restSpeed:h}){const u=t[0],y={done:!1,value:u},f=V=>a!==void 0&&V<a||c!==void 0&&V>c,p=V=>a===void 0?c:c===void 0||Math.abs(a-V)<Math.abs(c-V)?a:c;let m=n*e;const v=u+m,b=r===void 0?v:r(v);b!==v&&(m=b-u);const k=V=>-m*Math.exp(-V/s),g=V=>b+k(V),M=V=>{const C=k(V),q=g(V);y.done=Math.abs(C)<=l,y.value=y.done?b:q};let P,S;const A=V=>{f(y.value)&&(P=V,S=ai({keyframes:[y.value,p(y.value)],velocity:oi(g,V,y.value),damping:i,stiffness:o,restDelta:l,restSpeed:h}))};return A(0),{calculatedDuration:null,next:V=>{let C=!1;return!S&&P===void 0&&(C=!0,M(V),A(V)),P!==void 0&&V>P?S.next(V-P):(!C&&M(V),y)}}}const Po=t=>{const e=({timestamp:n})=>t(n);return{start:()=>T.update(e,!0),stop:()=>_(e),now:()=>F.isProcessing?F.timestamp:performance.now()}},bn=2e4;function wn(t){let e=0;const n=50;let s=t.next(e);for(;!s.done&&e<bn;)e+=n,s=t.next(e);return e>=bn?1/0:e}const Vo={decay:Mn,inertia:Mn,tween:_t,keyframes:_t,spring:ai};function Xt({autoplay:t=!0,delay:e=0,driver:n=Po,keyframes:s,type:i="keyframes",repeat:o=0,repeatDelay:r=0,repeatType:a="loop",onPlay:c,onStop:l,onComplete:h,onUpdate:u,...y}){let f=1,p=!1,m,v;const b=()=>{v=new Promise(L=>{m=L})};b();let k;const g=Vo[i]||_t;let M;g!==_t&&typeof s[0]!="number"&&(M=ii([0,100],s,{clamp:!1}),s=[0,100]);const P=g({...y,keyframes:s});let S;a==="mirror"&&(S=g({...y,keyframes:[...s].reverse(),velocity:-(y.velocity||0)}));let A="idle",V=null,C=null,q=null;P.calculatedDuration===null&&o&&(P.calculatedDuration=wn(P));const{calculatedDuration:dt}=P;let N=1/0,G=1/0;dt!==null&&(N=dt+r,G=N*(o+1)-r);let E=0;const yt=L=>{if(C===null)return;f>0&&(C=Math.min(C,L)),f<0&&(C=Math.min(L-G/f,C)),V!==null?E=V:E=Math.round(L-C)*f;const bt=E-e*(f>=0?1:-1),sn=f>=0?bt<0:bt>G;E=Math.max(bt,0),A==="finished"&&V===null&&(E=G);let rn=E,on=P;if(o){const ae=Math.min(E,G)/N;let Ot=Math.floor(ae),st=ae%1;!st&&ae>=1&&(st=1),st===1&&Ot--,Ot=Math.min(Ot,o+1),!!(Ot%2)&&(a==="reverse"?(st=1-st,r&&(st-=r/N)):a==="mirror"&&(on=S)),rn=tt(0,1,st)*N}const wt=sn?{done:!1,value:s[0]}:on.next(rn);M&&(wt.value=M(wt.value));let{done:an}=wt;!sn&&dt!==null&&(an=f>=0?E>=G:E<=0);const Bi=V===null&&(A==="finished"||A==="running"&&an);return u&&u(wt.value),Bi&&Mt(),wt},B=()=>{k&&k.stop(),k=void 0},X=()=>{A="idle",B(),m(),b(),C=q=null},Mt=()=>{A="finished",h&&h(),B(),m()},ft=()=>{if(p)return;k||(k=n(yt));const L=k.now();c&&c(),V!==null?C=L-V:(!C||A==="finished")&&(C=L),A==="finished"&&b(),q=C,V=null,A="running",k.start()};t&&ft();const nn={then(L,bt){return v.then(L,bt)},get time(){return K(E)},set time(L){L=lt(L),E=L,V!==null||!k||f===0?V=L:C=k.now()-L/f},get duration(){const L=P.calculatedDuration===null?wn(P):P.calculatedDuration;return K(L)},get speed(){return f},set speed(L){L===f||!k||(f=L,nn.time=K(E))},get state(){return A},play:ft,pause:()=>{A="paused",V=E},stop:()=>{p=!0,A!=="idle"&&(A="idle",l&&l(),X())},cancel:()=>{q!==null&&yt(q),X()},complete:()=>{A="finished"},sample:L=>(C=0,yt(L))};return nn}function Co(t){let e;return()=>(e===void 0&&(e=t()),e)}const To=Co(()=>Object.hasOwnProperty.call(Element.prototype,"animate")),So=new Set(["opacity","clipPath","filter","transform","backgroundColor"]),It=10,Ao=2e4,Lo=(t,e)=>e.type==="spring"||t==="backgroundColor"||!Os(e.ease);function Do(t,e,{onUpdate:n,onComplete:s,...i}){if(!(To()&&So.has(e)&&!i.repeatDelay&&i.repeatType!=="mirror"&&i.damping!==0&&i.type!=="inertia"))return!1;let r=!1,a,c,l=!1;const h=()=>{c=new Promise(g=>{a=g})};h();let{keyframes:u,duration:y=300,ease:f,times:p}=i;if(Lo(e,i)){const g=Xt({...i,repeat:0,delay:0});let M={done:!1,value:u[0]};const P=[];let S=0;for(;!M.done&&S<Ao;)M=g.sample(S),P.push(M.value),S+=It;p=void 0,u=P,y=S-It,f="linear"}const m=Hr(t.owner.current,e,u,{...i,duration:y,ease:f,times:p}),v=()=>{l=!1,m.cancel()},b=()=>{l=!0,T.update(v),a(),h()};return m.onfinish=()=>{l||(t.set(qr(u,i)),s&&s(),b())},{then(g,M){return c.then(g,M)},attachTimeline(g){return m.timeline=g,m.onfinish=null,R},get time(){return K(m.currentTime||0)},set time(g){m.currentTime=lt(g)},get speed(){return m.playbackRate},set speed(g){m.playbackRate=g},get duration(){return K(y)},play:()=>{r||(m.play(),_(v))},pause:()=>m.pause(),stop:()=>{if(r=!0,m.playState==="idle")return;const{currentTime:g}=m;if(g){const M=Xt({...i,autoplay:!1});t.setWithVelocity(M.sample(g-It).value,M.sample(g).value,It)}b()},complete:()=>{l||m.finish()},cancel:b}}function Ro({keyframes:t,delay:e,onUpdate:n,onComplete:s}){const i=()=>(n&&n(t[t.length-1]),s&&s(),{time:0,speed:1,duration:0,play:R,pause:R,stop:R,then:o=>(o(),Promise.resolve()),cancel:R,complete:R});return e?Xt({keyframes:[0,1],duration:0,delay:e,onComplete:i}):i()}const jo={type:"spring",stiffness:500,damping:25,restSpeed:10},Bo=t=>({type:"spring",stiffness:550,damping:t===0?2*Math.sqrt(550):30,restSpeed:10}),Fo={type:"keyframes",duration:.8},Eo={type:"keyframes",ease:[.25,.1,.35,1],duration:.3},zo=(t,{keyframes:e})=>e.length>2?Fo:ht.has(t)?t.startsWith("scale")?Bo(e[1]):jo:Eo,Ve=(t,e)=>t==="zIndex"?!1:!!(typeof e=="number"||Array.isArray(e)||typeof e=="string"&&(et.test(e)||e==="0")&&!e.startsWith("url(")),Oo=new Set(["brightness","contrast","saturate","opacity"]);function Ho(t){const[e,n]=t.slice(0,-1).split("(");if(e==="drop-shadow")return t;const[s]=n.match(ie)||[];if(!s)return t;const i=n.replace(s,"");let o=Oo.has(e)?1:0;return s!==n&&(o*=100),e+"("+o+i+")"}const qo=/([a-z-]*)\(.*?\)/g,Ce={...et,getAnimatableNone:t=>{const e=t.match(qo);return e?e.map(Ho).join(" "):t}},Io={...Ms,color:z,backgroundColor:z,outlineColor:z,fill:z,stroke:z,borderColor:z,borderTopColor:z,borderRightColor:z,borderBottomColor:z,borderLeftColor:z,filter:Ce,WebkitFilter:Ce},Xe=t=>Io[t];function ci(t,e){let n=Xe(t);return n!==Ce&&(n=et),n.getAnimatableNone?n.getAnimatableNone(e):void 0}const li=t=>/^0[^.\s]+$/.test(t);function Uo(t){if(typeof t=="number")return t===0;if(t!==null)return t==="none"||t==="0"||li(t)}function No(t,e,n,s){const i=Ve(e,n);let o;Array.isArray(n)?o=[...n]:o=[null,n];const r=s.from!==void 0?s.from:t.get();let a;const c=[];for(let l=0;l<o.length;l++)o[l]===null&&(o[l]=l===0?r:o[l-1]),Uo(o[l])&&c.push(l),typeof o[l]=="string"&&o[l]!=="none"&&o[l]!=="0"&&(a=o[l]);if(i&&c.length&&a)for(let l=0;l<c.length;l++){const h=c[l];o[h]=ci(e,a)}return o}function Wo({when:t,delay:e,delayChildren:n,staggerChildren:s,staggerDirection:i,repeat:o,repeatType:r,repeatDelay:a,from:c,elapsed:l,...h}){return!!Object.keys(h).length}function Ye(t,e){return t[e]||t.default||t}const Go={skipAnimations:!1},Qe=(t,e,n,s={})=>i=>{const o=Ye(s,t)||{},r=o.delay||s.delay||0;let{elapsed:a=0}=s;a=a-lt(r);const c=No(e,t,n,o),l=c[0],h=c[c.length-1],u=Ve(t,l),y=Ve(t,h);let f={keyframes:c,velocity:e.getVelocity(),ease:"easeOut",...o,delay:-a,onUpdate:p=>{e.set(p),o.onUpdate&&o.onUpdate(p)},onComplete:()=>{i(),o.onComplete&&o.onComplete()}};if(Wo(o)||(f={...f,...zo(t,f)}),f.duration&&(f.duration=lt(f.duration)),f.repeatDelay&&(f.repeatDelay=lt(f.repeatDelay)),!u||!y||Or.current||o.type===!1||Go.skipAnimations)return Ro(f);if(!s.isHandoff&&e.owner&&e.owner.current instanceof HTMLElement&&!e.owner.getProps().onUpdate){const p=Do(e,t,f);if(p)return p}return Xt(f)};function Yt(t){return!!(O(t)&&t.add)}const hi=t=>/^\-?\d*\.?\d+$/.test(t);function Je(t,e){t.indexOf(e)===-1&&t.push(e)}function tn(t,e){const n=t.indexOf(e);n>-1&&t.splice(n,1)}class en{constructor(){this.subscriptions=[]}add(e){return Je(this.subscriptions,e),()=>tn(this.subscriptions,e)}notify(e,n,s){const i=this.subscriptions.length;if(i)if(i===1)this.subscriptions[0](e,n,s);else for(let o=0;o<i;o++){const r=this.subscriptions[o];r&&r(e,n,s)}}getSize(){return this.subscriptions.length}clear(){this.subscriptions.length=0}}const Zo=t=>!isNaN(parseFloat(t));class $o{constructor(e,n={}){this.version="10.18.0",this.timeDelta=0,this.lastUpdated=0,this.canTrackVelocity=!1,this.events={},this.updateAndNotify=(s,i=!0)=>{this.prev=this.current,this.current=s;const{delta:o,timestamp:r}=F;this.lastUpdated!==r&&(this.timeDelta=o,this.lastUpdated=r,T.postRender(this.scheduleVelocityCheck)),this.prev!==this.current&&this.events.change&&this.events.change.notify(this.current),this.events.velocityChange&&this.events.velocityChange.notify(this.getVelocity()),i&&this.events.renderRequest&&this.events.renderRequest.notify(this.current)},this.scheduleVelocityCheck=()=>T.postRender(this.velocityCheck),this.velocityCheck=({timestamp:s})=>{s!==this.lastUpdated&&(this.prev=this.current,this.events.velocityChange&&this.events.velocityChange.notify(this.getVelocity()))},this.hasAnimated=!1,this.prev=this.current=e,this.canTrackVelocity=Zo(this.current),this.owner=n.owner}onChange(e){return this.on("change",e)}on(e,n){this.events[e]||(this.events[e]=new en);const s=this.events[e].add(n);return e==="change"?()=>{s(),T.read(()=>{this.events.change.getSize()||this.stop()})}:s}clearListeners(){for(const e in this.events)this.events[e].clear()}attach(e,n){this.passiveEffect=e,this.stopPassiveEffect=n}set(e,n=!0){!n||!this.passiveEffect?this.updateAndNotify(e,n):this.passiveEffect(e,this.updateAndNotify)}setWithVelocity(e,n,s){this.set(n),this.prev=e,this.timeDelta=s}jump(e){this.updateAndNotify(e),this.prev=e,this.stop(),this.stopPassiveEffect&&this.stopPassiveEffect()}get(){return this.current}getPrevious(){return this.prev}getVelocity(){return this.canTrackVelocity?ri(parseFloat(this.current)-parseFloat(this.prev),this.timeDelta):0}start(e){return this.stop(),new Promise(n=>{this.hasAnimated=!0,this.animation=e(n),this.events.animationStart&&this.events.animationStart.notify()}).then(()=>{this.events.animationComplete&&this.events.animationComplete.notify(),this.clearAnimation()})}stop(){this.animation&&(this.animation.stop(),this.events.animationCancel&&this.events.animationCancel.notify()),this.clearAnimation()}isAnimating(){return!!this.animation}clearAnimation(){delete this.animation}destroy(){this.clearListeners(),this.stop(),this.stopPassiveEffect&&this.stopPassiveEffect()}}function kt(t,e){return new $o(t,e)}const ui=t=>e=>e.test(t),Ko={test:t=>t==="auto",parse:t=>t},di=[ut,w,W,Y,tr,Ji,Ko],Pt=t=>di.find(ui(t)),_o=[...di,z,et],Xo=t=>_o.find(ui(t));function Yo(t,e,n){t.hasValue(e)?t.getValue(e).set(n):t.addValue(e,kt(n))}function Qo(t,e){const n=oe(t,e);let{transitionEnd:s={},transition:i={},...o}=n?t.makeTargetAnimatable(n,!1):{};o={...o,...s};for(const r in o){const a=fr(o[r]);Yo(t,r,a)}}function Jo(t,e,n){var s,i;const o=Object.keys(e).filter(a=>!t.hasValue(a)),r=o.length;if(r)for(let a=0;a<r;a++){const c=o[a],l=e[c];let h=null;Array.isArray(l)&&(h=l[0]),h===null&&(h=(i=(s=n[c])!==null&&s!==void 0?s:t.readValue(c))!==null&&i!==void 0?i:e[c]),h!=null&&(typeof h=="string"&&(hi(h)||li(h))?h=parseFloat(h):!Xo(h)&&et.test(l)&&(h=ci(c,l)),t.addValue(c,kt(h,{owner:t})),n[c]===void 0&&(n[c]=h),h!==null&&t.setBaseTarget(c,h))}}function ta(t,e){return e?(e[t]||e.default||e).from:void 0}function ea(t,e,n){const s={};for(const i in t){const o=ta(i,e);if(o!==void 0)s[i]=o;else{const r=n.getValue(i);r&&(s[i]=r.get())}}return s}function na({protectedKeys:t,needsAnimating:e},n){const s=t.hasOwnProperty(n)&&e[n]!==!0;return e[n]=!1,s}function sa(t,e){const n=t.get();if(Array.isArray(e)){for(let s=0;s<e.length;s++)if(e[s]!==n)return!0}else return n!==e}function yi(t,e,{delay:n=0,transitionOverride:s,type:i}={}){let{transition:o=t.getDefaultTransition(),transitionEnd:r,...a}=t.makeTargetAnimatable(e);const c=t.getValue("willChange");s&&(o=s);const l=[],h=i&&t.animationState&&t.animationState.getState()[i];for(const u in a){const y=t.getValue(u),f=a[u];if(!y||f===void 0||h&&na(h,u))continue;const p={delay:n,elapsed:0,...Ye(o||{},u)};if(window.HandoffAppearAnimations){const b=t.getProps()[fs];if(b){const k=window.HandoffAppearAnimations(b,u,y,T);k!==null&&(p.elapsed=k,p.isHandoff=!0)}}let m=!p.isHandoff&&!sa(y,f);if(p.type==="spring"&&(y.getVelocity()||p.velocity)&&(m=!1),y.animation&&(m=!1),m)continue;y.start(Qe(u,y,f,t.shouldReduceMotion&&ht.has(u)?{type:!1}:p));const v=y.animation;Yt(c)&&(c.add(u),v.then(()=>c.remove(u))),l.push(v)}return r&&Promise.all(l).then(()=>{r&&Qo(t,r)}),l}function Te(t,e,n={}){const s=oe(t,e,n.custom);let{transition:i=t.getDefaultTransition()||{}}=s||{};n.transitionOverride&&(i=n.transitionOverride);const o=s?()=>Promise.all(yi(t,s,n)):()=>Promise.resolve(),r=t.variantChildren&&t.variantChildren.size?(c=0)=>{const{delayChildren:l=0,staggerChildren:h,staggerDirection:u}=i;return ia(t,e,l+c,h,u,n)}:()=>Promise.resolve(),{when:a}=i;if(a){const[c,l]=a==="beforeChildren"?[o,r]:[r,o];return c().then(()=>l())}else return Promise.all([o(),r(n.delay)])}function ia(t,e,n=0,s=0,i=1,o){const r=[],a=(t.variantChildren.size-1)*s,c=i===1?(l=0)=>l*s:(l=0)=>a-l*s;return Array.from(t.variantChildren).sort(ra).forEach((l,h)=>{l.notify("AnimationStart",e),r.push(Te(l,e,{...o,delay:n+c(h)}).then(()=>l.notify("AnimationComplete",e)))}),Promise.all(r)}function ra(t,e){return t.sortNodePosition(e)}function oa(t,e,n={}){t.notify("AnimationStart",e);let s;if(Array.isArray(e)){const i=e.map(o=>Te(t,o,n));s=Promise.all(i)}else if(typeof e=="string")s=Te(t,e,n);else{const i=typeof e=="function"?oe(t,e,n.custom):e;s=Promise.all(yi(t,i,n))}return s.then(()=>t.notify("AnimationComplete",e))}const aa=[...Ee].reverse(),ca=Ee.length;function la(t){return e=>Promise.all(e.map(({animation:n,options:s})=>oa(t,n,s)))}function ha(t){let e=la(t);const n=da();let s=!0;const i=(c,l)=>{const h=oe(t,l);if(h){const{transition:u,transitionEnd:y,...f}=h;c={...c,...f,...y}}return c};function o(c){e=c(t)}function r(c,l){const h=t.getProps(),u=t.getVariantContext(!0)||{},y=[],f=new Set;let p={},m=1/0;for(let b=0;b<ca;b++){const k=aa[b],g=n[k],M=h[k]!==void 0?h[k]:u[k],P=Dt(M),S=k===l?g.isActive:null;S===!1&&(m=b);let A=M===u[k]&&M!==h[k]&&P;if(A&&s&&t.manuallyAnimateOnMount&&(A=!1),g.protectedKeys={...p},!g.isActive&&S===null||!M&&!g.prevProp||ne(M)||typeof M=="boolean")continue;let C=ua(g.prevProp,M)||k===l&&g.isActive&&!A&&P||b>m&&P,q=!1;const dt=Array.isArray(M)?M:[M];let N=dt.reduce(i,{});S===!1&&(N={});const{prevResolvedValues:G={}}=g,E={...G,...N},yt=B=>{C=!0,f.has(B)&&(q=!0,f.delete(B)),g.needsAnimating[B]=!0};for(const B in E){const X=N[B],Mt=G[B];if(p.hasOwnProperty(B))continue;let ft=!1;$t(X)&&$t(Mt)?ft=!Es(X,Mt):ft=X!==Mt,ft?X!==void 0?yt(B):f.add(B):X!==void 0&&f.has(B)?yt(B):g.protectedKeys[B]=!0}g.prevProp=M,g.prevResolvedValues=N,g.isActive&&(p={...p,...N}),s&&t.blockInitialAnimation&&(C=!1),C&&(!A||q)&&y.push(...dt.map(B=>({animation:B,options:{type:k,...c}})))}if(f.size){const b={};f.forEach(k=>{const g=t.getBaseTarget(k);g!==void 0&&(b[k]=g)}),y.push({animation:b})}let v=!!y.length;return s&&(h.initial===!1||h.initial===h.animate)&&!t.manuallyAnimateOnMount&&(v=!1),s=!1,v?e(y):Promise.resolve()}function a(c,l,h){var u;if(n[c].isActive===l)return Promise.resolve();(u=t.variantChildren)===null||u===void 0||u.forEach(f=>{var p;return(p=f.animationState)===null||p===void 0?void 0:p.setActive(c,l)}),n[c].isActive=l;const y=r(h,c);for(const f in n)n[f].protectedKeys={};return y}return{animateChanges:r,setActive:a,setAnimateFunction:o,getState:()=>n}}function ua(t,e){return typeof e=="string"?e!==t:Array.isArray(e)?!Es(e,t):!1}function it(t=!1){return{isActive:t,protectedKeys:{},needsAnimating:{},prevResolvedValues:{}}}function da(){return{animate:it(!0),whileInView:it(),whileHover:it(),whileTap:it(),whileDrag:it(),whileFocus:it(),exit:it()}}class ya extends nt{constructor(e){super(e),e.animationState||(e.animationState=ha(e))}updateAnimationControlsSubscription(){const{animate:e}=this.node.getProps();this.unmount(),ne(e)&&(this.unmount=e.subscribe(this.node))}mount(){this.updateAnimationControlsSubscription()}update(){const{animate:e}=this.node.getProps(),{animate:n}=this.node.prevProps||{};e!==n&&this.updateAnimationControlsSubscription()}unmount(){}}let fa=0;class pa extends nt{constructor(){super(...arguments),this.id=fa++}update(){if(!this.node.presenceContext)return;const{isPresent:e,onExitComplete:n,custom:s}=this.node.presenceContext,{isPresent:i}=this.node.prevPresenceContext||{};if(!this.node.animationState||e===i)return;const o=this.node.animationState.setActive("exit",!e,{custom:s??this.node.getProps().custom});n&&!e&&o.then(()=>n(this.id))}mount(){const{register:e}=this.node.presenceContext||{};e&&(this.unmount=e(this.id))}unmount(){}}const ma={animation:{Feature:ya},exit:{Feature:pa}},Pn=(t,e)=>Math.abs(t-e);function ga(t,e){const n=Pn(t.x,e.x),s=Pn(t.y,e.y);return Math.sqrt(n**2+s**2)}class fi{constructor(e,n,{transformPagePoint:s,contextWindow:i,dragSnapToOrigin:o=!1}={}){if(this.startEvent=null,this.lastMoveEvent=null,this.lastMoveEventInfo=null,this.handlers={},this.contextWindow=window,this.updatePoint=()=>{if(!(this.lastMoveEvent&&this.lastMoveEventInfo))return;const u=ge(this.lastMoveEventInfo,this.history),y=this.startEvent!==null,f=ga(u.offset,{x:0,y:0})>=3;if(!y&&!f)return;const{point:p}=u,{timestamp:m}=F;this.history.push({...p,timestamp:m});const{onStart:v,onMove:b}=this.handlers;y||(v&&v(this.lastMoveEvent,u),this.startEvent=this.lastMoveEvent),b&&b(this.lastMoveEvent,u)},this.handlePointerMove=(u,y)=>{this.lastMoveEvent=u,this.lastMoveEventInfo=me(y,this.transformPagePoint),T.update(this.updatePoint,!0)},this.handlePointerUp=(u,y)=>{this.end();const{onEnd:f,onSessionEnd:p,resumeAnimation:m}=this.handlers;if(this.dragSnapToOrigin&&m&&m(),!(this.lastMoveEvent&&this.lastMoveEventInfo))return;const v=ge(u.type==="pointercancel"?this.lastMoveEventInfo:me(y,this.transformPagePoint),this.history);this.startEvent&&f&&f(u,v),p&&p(u,v)},!Ds(e))return;this.dragSnapToOrigin=o,this.handlers=n,this.transformPagePoint=s,this.contextWindow=i||window;const r=re(e),a=me(r,this.transformPagePoint),{point:c}=a,{timestamp:l}=F;this.history=[{...c,timestamp:l}];const{onSessionStart:h}=n;h&&h(e,ge(a,this.history)),this.removeListeners=J($(this.contextWindow,"pointermove",this.handlePointerMove),$(this.contextWindow,"pointerup",this.handlePointerUp),$(this.contextWindow,"pointercancel",this.handlePointerUp))}updateHandlers(e){this.handlers=e}end(){this.removeListeners&&this.removeListeners(),_(this.updatePoint)}}function me(t,e){return e?{point:e(t.point)}:t}function Vn(t,e){return{x:t.x-e.x,y:t.y-e.y}}function ge({point:t},e){return{point:t,delta:Vn(t,pi(e)),offset:Vn(t,xa(e)),velocity:ka(e,.1)}}function xa(t){return t[0]}function pi(t){return t[t.length-1]}function ka(t,e){if(t.length<2)return{x:0,y:0};let n=t.length-1,s=null;const i=pi(t);for(;n>=0&&(s=t[n],!(i.timestamp-s.timestamp>lt(e)));)n--;if(!s)return{x:0,y:0};const o=K(i.timestamp-s.timestamp);if(o===0)return{x:0,y:0};const r={x:(i.x-s.x)/o,y:(i.y-s.y)/o};return r.x===1/0&&(r.x=0),r.y===1/0&&(r.y=0),r}function H(t){return t.max-t.min}function Se(t,e=0,n=.01){return Math.abs(t-e)<=n}function Cn(t,e,n,s=.5){t.origin=s,t.originPoint=D(e.min,e.max,t.origin),t.scale=H(n)/H(e),(Se(t.scale,1,1e-4)||isNaN(t.scale))&&(t.scale=1),t.translate=D(n.min,n.max,t.origin)-t.originPoint,(Se(t.translate)||isNaN(t.translate))&&(t.translate=0)}function At(t,e,n,s){Cn(t.x,e.x,n.x,s?s.originX:void 0),Cn(t.y,e.y,n.y,s?s.originY:void 0)}function Tn(t,e,n){t.min=n.min+e.min,t.max=t.min+H(e)}function va(t,e,n){Tn(t.x,e.x,n.x),Tn(t.y,e.y,n.y)}function Sn(t,e,n){t.min=e.min-n.min,t.max=t.min+H(e)}function Lt(t,e,n){Sn(t.x,e.x,n.x),Sn(t.y,e.y,n.y)}function Ma(t,{min:e,max:n},s){return e!==void 0&&t<e?t=s?D(e,t,s.min):Math.max(t,e):n!==void 0&&t>n&&(t=s?D(n,t,s.max):Math.min(t,n)),t}function An(t,e,n){return{min:e!==void 0?t.min+e:void 0,max:n!==void 0?t.max+n-(t.max-t.min):void 0}}function ba(t,{top:e,left:n,bottom:s,right:i}){return{x:An(t.x,n,i),y:An(t.y,e,s)}}function Ln(t,e){let n=e.min-t.min,s=e.max-t.max;return e.max-e.min<t.max-t.min&&([n,s]=[s,n]),{min:n,max:s}}function wa(t,e){return{x:Ln(t.x,e.x),y:Ln(t.y,e.y)}}function Pa(t,e){let n=.5;const s=H(t),i=H(e);return i>s?n=jt(e.min,e.max-s,t.min):s>i&&(n=jt(t.min,t.max-i,e.min)),tt(0,1,n)}function Va(t,e){const n={};return e.min!==void 0&&(n.min=e.min-t.min),e.max!==void 0&&(n.max=e.max-t.min),n}const Ae=.35;function Ca(t=Ae){return t===!1?t=0:t===!0&&(t=Ae),{x:Dn(t,"left","right"),y:Dn(t,"top","bottom")}}function Dn(t,e,n){return{min:Rn(t,e),max:Rn(t,n)}}function Rn(t,e){return typeof t=="number"?t:t[e]||0}const jn=()=>({translate:0,scale:1,origin:0,originPoint:0}),gt=()=>({x:jn(),y:jn()}),Bn=()=>({min:0,max:0}),j=()=>({x:Bn(),y:Bn()});function U(t){return[t("x"),t("y")]}function mi({top:t,left:e,right:n,bottom:s}){return{x:{min:e,max:n},y:{min:t,max:s}}}function Ta({x:t,y:e}){return{top:e.min,right:t.max,bottom:e.max,left:t.min}}function Sa(t,e){if(!e)return t;const n=e({x:t.left,y:t.top}),s=e({x:t.right,y:t.bottom});return{top:n.y,left:n.x,bottom:s.y,right:s.x}}function xe(t){return t===void 0||t===1}function Le({scale:t,scaleX:e,scaleY:n}){return!xe(t)||!xe(e)||!xe(n)}function rt(t){return Le(t)||gi(t)||t.z||t.rotate||t.rotateX||t.rotateY}function gi(t){return Fn(t.x)||Fn(t.y)}function Fn(t){return t&&t!=="0%"}function Qt(t,e,n){const s=t-n,i=e*s;return n+i}function En(t,e,n,s,i){return i!==void 0&&(t=Qt(t,i,s)),Qt(t,n,s)+e}function De(t,e=0,n=1,s,i){t.min=En(t.min,e,n,s,i),t.max=En(t.max,e,n,s,i)}function xi(t,{x:e,y:n}){De(t.x,e.translate,e.scale,e.originPoint),De(t.y,n.translate,n.scale,n.originPoint)}function Aa(t,e,n,s=!1){const i=n.length;if(!i)return;e.x=e.y=1;let o,r;for(let a=0;a<i;a++){o=n[a],r=o.projectionDelta;const c=o.instance;c&&c.style&&c.style.display==="contents"||(s&&o.options.layoutScroll&&o.scroll&&o!==o.root&&xt(t,{x:-o.scroll.offset.x,y:-o.scroll.offset.y}),r&&(e.x*=r.x.scale,e.y*=r.y.scale,xi(t,r)),s&&rt(o.latestValues)&&xt(t,o.latestValues))}e.x=zn(e.x),e.y=zn(e.y)}function zn(t){return Number.isInteger(t)||t>1.0000000000001||t<.999999999999?t:1}function Q(t,e){t.min=t.min+e,t.max=t.max+e}function On(t,e,[n,s,i]){const o=e[i]!==void 0?e[i]:.5,r=D(t.min,t.max,o);De(t,e[n],e[s],r,e.scale)}const La=["x","scaleX","originX"],Da=["y","scaleY","originY"];function xt(t,e){On(t.x,e,La),On(t.y,e,Da)}function ki(t,e){return mi(Sa(t.getBoundingClientRect(),e))}function Ra(t,e,n){const s=ki(t,n),{scroll:i}=e;return i&&(Q(s.x,i.offset.x),Q(s.y,i.offset.y)),s}const vi=({current:t})=>t?t.ownerDocument.defaultView:null,ja=new WeakMap;class Ba{constructor(e){this.openGlobalLock=null,this.isDragging=!1,this.currentDirection=null,this.originPoint={x:0,y:0},this.constraints=!1,this.hasMutatedConstraints=!1,this.elastic=j(),this.visualElement=e}start(e,{snapToCursor:n=!1}={}){const{presenceContext:s}=this.visualElement;if(s&&s.isPresent===!1)return;const i=h=>{const{dragSnapToOrigin:u}=this.getProps();u?this.pauseAnimation():this.stopAnimation(),n&&this.snapToCursor(re(h,"page").point)},o=(h,u)=>{const{drag:y,dragPropagation:f,onDragStart:p}=this.getProps();if(y&&!f&&(this.openGlobalLock&&this.openGlobalLock(),this.openGlobalLock=js(y),!this.openGlobalLock))return;this.isDragging=!0,this.currentDirection=null,this.resolveConstraints(),this.visualElement.projection&&(this.visualElement.projection.isAnimationBlocked=!0,this.visualElement.projection.target=void 0),U(v=>{let b=this.getAxisMotionValue(v).get()||0;if(W.test(b)){const{projection:k}=this.visualElement;if(k&&k.layout){const g=k.layout.layoutBox[v];g&&(b=H(g)*(parseFloat(b)/100))}}this.originPoint[v]=b}),p&&T.update(()=>p(h,u),!1,!0);const{animationState:m}=this.visualElement;m&&m.setActive("whileDrag",!0)},r=(h,u)=>{const{dragPropagation:y,dragDirectionLock:f,onDirectionLock:p,onDrag:m}=this.getProps();if(!y&&!this.openGlobalLock)return;const{offset:v}=u;if(f&&this.currentDirection===null){this.currentDirection=Fa(v),this.currentDirection!==null&&p&&p(this.currentDirection);return}this.updateAxis("x",u.point,v),this.updateAxis("y",u.point,v),this.visualElement.render(),m&&m(h,u)},a=(h,u)=>this.stop(h,u),c=()=>U(h=>{var u;return this.getAnimationState(h)==="paused"&&((u=this.getAxisMotionValue(h).animation)===null||u===void 0?void 0:u.play())}),{dragSnapToOrigin:l}=this.getProps();this.panSession=new fi(e,{onSessionStart:i,onStart:o,onMove:r,onSessionEnd:a,resumeAnimation:c},{transformPagePoint:this.visualElement.getTransformPagePoint(),dragSnapToOrigin:l,contextWindow:vi(this.visualElement)})}stop(e,n){const s=this.isDragging;if(this.cancel(),!s)return;const{velocity:i}=n;this.startAnimation(i);const{onDragEnd:o}=this.getProps();o&&T.update(()=>o(e,n))}cancel(){this.isDragging=!1;const{projection:e,animationState:n}=this.visualElement;e&&(e.isAnimationBlocked=!1),this.panSession&&this.panSession.end(),this.panSession=void 0;const{dragPropagation:s}=this.getProps();!s&&this.openGlobalLock&&(this.openGlobalLock(),this.openGlobalLock=null),n&&n.setActive("whileDrag",!1)}updateAxis(e,n,s){const{drag:i}=this.getProps();if(!s||!Ut(e,i,this.currentDirection))return;const o=this.getAxisMotionValue(e);let r=this.originPoint[e]+s[e];this.constraints&&this.constraints[e]&&(r=Ma(r,this.constraints[e],this.elastic[e])),o.set(r)}resolveConstraints(){var e;const{dragConstraints:n,dragElastic:s}=this.getProps(),i=this.visualElement.projection&&!this.visualElement.projection.layout?this.visualElement.projection.measure(!1):(e=this.visualElement.projection)===null||e===void 0?void 0:e.layout,o=this.constraints;n&&pt(n)?this.constraints||(this.constraints=this.resolveRefConstraints()):n&&i?this.constraints=ba(i.layoutBox,n):this.constraints=!1,this.elastic=Ca(s),o!==this.constraints&&i&&this.constraints&&!this.hasMutatedConstraints&&U(r=>{this.getAxisMotionValue(r)&&(this.constraints[r]=Va(i.layoutBox[r],this.constraints[r]))})}resolveRefConstraints(){const{dragConstraints:e,onMeasureDragConstraints:n}=this.getProps();if(!e||!pt(e))return!1;const s=e.current,{projection:i}=this.visualElement;if(!i||!i.layout)return!1;const o=Ra(s,i.root,this.visualElement.getTransformPagePoint());let r=wa(i.layout.layoutBox,o);if(n){const a=n(Ta(r));this.hasMutatedConstraints=!!a,a&&(r=mi(a))}return r}startAnimation(e){const{drag:n,dragMomentum:s,dragElastic:i,dragTransition:o,dragSnapToOrigin:r,onDragTransitionEnd:a}=this.getProps(),c=this.constraints||{},l=U(h=>{if(!Ut(h,n,this.currentDirection))return;let u=c&&c[h]||{};r&&(u={min:0,max:0});const y=i?200:1e6,f=i?40:1e7,p={type:"inertia",velocity:s?e[h]:0,bounceStiffness:y,bounceDamping:f,timeConstant:750,restDelta:1,restSpeed:10,...o,...u};return this.startAxisValueAnimation(h,p)});return Promise.all(l).then(a)}startAxisValueAnimation(e,n){const s=this.getAxisMotionValue(e);return s.start(Qe(e,s,0,n))}stopAnimation(){U(e=>this.getAxisMotionValue(e).stop())}pauseAnimation(){U(e=>{var n;return(n=this.getAxisMotionValue(e).animation)===null||n===void 0?void 0:n.pause()})}getAnimationState(e){var n;return(n=this.getAxisMotionValue(e).animation)===null||n===void 0?void 0:n.state}getAxisMotionValue(e){const n="_drag"+e.toUpperCase(),s=this.visualElement.getProps(),i=s[n];return i||this.visualElement.getValue(e,(s.initial?s.initial[e]:void 0)||0)}snapToCursor(e){U(n=>{const{drag:s}=this.getProps();if(!Ut(n,s,this.currentDirection))return;const{projection:i}=this.visualElement,o=this.getAxisMotionValue(n);if(i&&i.layout){const{min:r,max:a}=i.layout.layoutBox[n];o.set(e[n]-D(r,a,.5))}})}scalePositionWithinConstraints(){if(!this.visualElement.current)return;const{drag:e,dragConstraints:n}=this.getProps(),{projection:s}=this.visualElement;if(!pt(n)||!s||!this.constraints)return;this.stopAnimation();const i={x:0,y:0};U(r=>{const a=this.getAxisMotionValue(r);if(a){const c=a.get();i[r]=Pa({min:c,max:c},this.constraints[r])}});const{transformTemplate:o}=this.visualElement.getProps();this.visualElement.current.style.transform=o?o({},""):"none",s.root&&s.root.updateScroll(),s.updateLayout(),this.resolveConstraints(),U(r=>{if(!Ut(r,e,null))return;const a=this.getAxisMotionValue(r),{min:c,max:l}=this.constraints[r];a.set(D(c,l,i[r]))})}addListeners(){if(!this.visualElement.current)return;ja.set(this.visualElement,this);const e=this.visualElement.current,n=$(e,"pointerdown",c=>{const{drag:l,dragListener:h=!0}=this.getProps();l&&h&&this.start(c)}),s=()=>{const{dragConstraints:c}=this.getProps();pt(c)&&(this.constraints=this.resolveRefConstraints())},{projection:i}=this.visualElement,o=i.addEventListener("measure",s);i&&!i.layout&&(i.root&&i.root.updateScroll(),i.updateLayout()),s();const r=Z(window,"resize",()=>this.scalePositionWithinConstraints()),a=i.addEventListener("didUpdate",({delta:c,hasLayoutChanged:l})=>{this.isDragging&&l&&(U(h=>{const u=this.getAxisMotionValue(h);u&&(this.originPoint[h]+=c[h].translate,u.set(u.get()+c[h].translate))}),this.visualElement.render())});return()=>{r(),n(),o(),a&&a()}}getProps(){const e=this.visualElement.getProps(),{drag:n=!1,dragDirectionLock:s=!1,dragPropagation:i=!1,dragConstraints:o=!1,dragElastic:r=Ae,dragMomentum:a=!0}=e;return{...e,drag:n,dragDirectionLock:s,dragPropagation:i,dragConstraints:o,dragElastic:r,dragMomentum:a}}}function Ut(t,e,n){return(e===!0||e===t)&&(n===null||n===t)}function Fa(t,e=10){let n=null;return Math.abs(t.y)>e?n="y":Math.abs(t.x)>e&&(n="x"),n}class Ea extends nt{constructor(e){super(e),this.removeGroupControls=R,this.removeListeners=R,this.controls=new Ba(e)}mount(){const{dragControls:e}=this.node.getProps();e&&(this.removeGroupControls=e.subscribe(this.controls)),this.removeListeners=this.controls.addListeners()||R}unmount(){this.removeGroupControls(),this.removeListeners()}}const Hn=t=>(e,n)=>{t&&T.update(()=>t(e,n))};class za extends nt{constructor(){super(...arguments),this.removePointerDownListener=R}onPointerDown(e){this.session=new fi(e,this.createPanHandlers(),{transformPagePoint:this.node.getTransformPagePoint(),contextWindow:vi(this.node)})}createPanHandlers(){const{onPanSessionStart:e,onPanStart:n,onPan:s,onPanEnd:i}=this.node.getProps();return{onSessionStart:Hn(e),onStart:Hn(n),onMove:s,onEnd:(o,r)=>{delete this.session,i&&T.update(()=>i(o,r))}}}mount(){this.removePointerDownListener=$(this.node.current,"pointerdown",e=>this.onPointerDown(e))}update(){this.session&&this.session.updateHandlers(this.createPanHandlers())}unmount(){this.removePointerDownListener(),this.session&&this.session.end()}}function Oa(){const t=x.useContext(te);if(t===null)return[!0,null];const{isPresent:e,onExitComplete:n,register:s}=t,i=x.useId();return x.useEffect(()=>s(i),[]),!e&&n?[!1,()=>n&&n(i)]:[!0]}const Wt={hasAnimatedSinceResize:!0,hasEverUpdated:!1};function qn(t,e){return e.max===e.min?0:t/(e.max-e.min)*100}const Vt={correct:(t,e)=>{if(!e.target)return t;if(typeof t=="string")if(w.test(t))t=parseFloat(t);else return t;const n=qn(t,e.target.x),s=qn(t,e.target.y);return`${n}% ${s}%`}},Ha={correct:(t,{treeScale:e,projectionDelta:n})=>{const s=t,i=et.parse(t);if(i.length>5)return s;const o=et.createTransformer(t),r=typeof i[0]!="number"?1:0,a=n.x.scale*e.x,c=n.y.scale*e.y;i[0+r]/=a,i[1+r]/=c;const l=D(a,c,.5);return typeof i[2+r]=="number"&&(i[2+r]/=l),typeof i[3+r]=="number"&&(i[3+r]/=l),o(i)}};class qa extends us.Component{componentDidMount(){const{visualElement:e,layoutGroup:n,switchLayoutGroup:s,layoutId:i}=this.props,{projection:o}=e;Zi(Ia),o&&(n.group&&n.group.add(o),s&&s.register&&i&&s.register(o),o.root.didUpdate(),o.addEventListener("animationComplete",()=>{this.safeToRemove()}),o.setOptions({...o.options,onExitComplete:()=>this.safeToRemove()})),Wt.hasEverUpdated=!0}getSnapshotBeforeUpdate(e){const{layoutDependency:n,visualElement:s,drag:i,isPresent:o}=this.props,r=s.projection;return r&&(r.isPresent=o,i||e.layoutDependency!==n||n===void 0?r.willUpdate():this.safeToRemove(),e.isPresent!==o&&(o?r.promote():r.relegate()||T.postRender(()=>{const a=r.getStack();(!a||!a.members.length)&&this.safeToRemove()}))),null}componentDidUpdate(){const{projection:e}=this.props.visualElement;e&&(e.root.didUpdate(),queueMicrotask(()=>{!e.currentAnimation&&e.isLead()&&this.safeToRemove()}))}componentWillUnmount(){const{visualElement:e,layoutGroup:n,switchLayoutGroup:s}=this.props,{projection:i}=e;i&&(i.scheduleCheckAfterUnmount(),n&&n.group&&n.group.remove(i),s&&s.deregister&&s.deregister(i))}safeToRemove(){const{safeToRemove:e}=this.props;e&&e()}render(){return null}}function Mi(t){const[e,n]=Oa(),s=x.useContext(Oe);return us.createElement(qa,{...t,layoutGroup:s,switchLayoutGroup:x.useContext(ms),isPresent:e,safeToRemove:n})}const Ia={borderRadius:{...Vt,applyTo:["borderTopLeftRadius","borderTopRightRadius","borderBottomLeftRadius","borderBottomRightRadius"]},borderTopLeftRadius:Vt,borderTopRightRadius:Vt,borderBottomLeftRadius:Vt,borderBottomRightRadius:Vt,boxShadow:Ha},bi=["TopLeft","TopRight","BottomLeft","BottomRight"],Ua=bi.length,In=t=>typeof t=="string"?parseFloat(t):t,Un=t=>typeof t=="number"||w.test(t);function Na(t,e,n,s,i,o){i?(t.opacity=D(0,n.opacity!==void 0?n.opacity:1,Wa(s)),t.opacityExit=D(e.opacity!==void 0?e.opacity:1,0,Ga(s))):o&&(t.opacity=D(e.opacity!==void 0?e.opacity:1,n.opacity!==void 0?n.opacity:1,s));for(let r=0;r<Ua;r++){const a=`border${bi[r]}Radius`;let c=Nn(e,a),l=Nn(n,a);if(c===void 0&&l===void 0)continue;c||(c=0),l||(l=0),c===0||l===0||Un(c)===Un(l)?(t[a]=Math.max(D(In(c),In(l),s),0),(W.test(l)||W.test(c))&&(t[a]+="%")):t[a]=l}(e.rotate||n.rotate)&&(t.rotate=D(e.rotate||0,n.rotate||0,s))}function Nn(t,e){return t[e]!==void 0?t[e]:t.borderRadius}const Wa=wi(0,.5,Gs),Ga=wi(.5,.95,R);function wi(t,e,n){return s=>s<t?0:s>e?1:n(jt(t,e,s))}function Wn(t,e){t.min=e.min,t.max=e.max}function I(t,e){Wn(t.x,e.x),Wn(t.y,e.y)}function Gn(t,e,n,s,i){return t-=e,t=Qt(t,1/n,s),i!==void 0&&(t=Qt(t,1/i,s)),t}function Za(t,e=0,n=1,s=.5,i,o=t,r=t){if(W.test(e)&&(e=parseFloat(e),e=D(r.min,r.max,e/100)-r.min),typeof e!="number")return;let a=D(o.min,o.max,s);t===o&&(a-=e),t.min=Gn(t.min,e,n,a,i),t.max=Gn(t.max,e,n,a,i)}function Zn(t,e,[n,s,i],o,r){Za(t,e[n],e[s],e[i],e.scale,o,r)}const $a=["x","scaleX","originX"],Ka=["y","scaleY","originY"];function $n(t,e,n,s){Zn(t.x,e,$a,n?n.x:void 0,s?s.x:void 0),Zn(t.y,e,Ka,n?n.y:void 0,s?s.y:void 0)}function Kn(t){return t.translate===0&&t.scale===1}function Pi(t){return Kn(t.x)&&Kn(t.y)}function _a(t,e){return t.x.min===e.x.min&&t.x.max===e.x.max&&t.y.min===e.y.min&&t.y.max===e.y.max}function Vi(t,e){return Math.round(t.x.min)===Math.round(e.x.min)&&Math.round(t.x.max)===Math.round(e.x.max)&&Math.round(t.y.min)===Math.round(e.y.min)&&Math.round(t.y.max)===Math.round(e.y.max)}function _n(t){return H(t.x)/H(t.y)}class Xa{constructor(){this.members=[]}add(e){Je(this.members,e),e.scheduleRender()}remove(e){if(tn(this.members,e),e===this.prevLead&&(this.prevLead=void 0),e===this.lead){const n=this.members[this.members.length-1];n&&this.promote(n)}}relegate(e){const n=this.members.findIndex(i=>e===i);if(n===0)return!1;let s;for(let i=n;i>=0;i--){const o=this.members[i];if(o.isPresent!==!1){s=o;break}}return s?(this.promote(s),!0):!1}promote(e,n){const s=this.lead;if(e!==s&&(this.prevLead=s,this.lead=e,e.show(),s)){s.instance&&s.scheduleRender(),e.scheduleRender(),e.resumeFrom=s,n&&(e.resumeFrom.preserveOpacity=!0),s.snapshot&&(e.snapshot=s.snapshot,e.snapshot.latestValues=s.animationValues||s.latestValues),e.root&&e.root.isUpdating&&(e.isLayoutDirty=!0);const{crossfade:i}=e.options;i===!1&&s.hide()}}exitAnimationComplete(){this.members.forEach(e=>{const{options:n,resumingFrom:s}=e;n.onExitComplete&&n.onExitComplete(),s&&s.options.onExitComplete&&s.options.onExitComplete()})}scheduleRender(){this.members.forEach(e=>{e.instance&&e.scheduleRender(!1)})}removeLeadSnapshot(){this.lead&&this.lead.snapshot&&(this.lead.snapshot=void 0)}}function Xn(t,e,n){let s="";const i=t.x.translate/e.x,o=t.y.translate/e.y;if((i||o)&&(s=`translate3d(${i}px, ${o}px, 0) `),(e.x!==1||e.y!==1)&&(s+=`scale(${1/e.x}, ${1/e.y}) `),n){const{rotate:c,rotateX:l,rotateY:h}=n;c&&(s+=`rotate(${c}deg) `),l&&(s+=`rotateX(${l}deg) `),h&&(s+=`rotateY(${h}deg) `)}const r=t.x.scale*e.x,a=t.y.scale*e.y;return(r!==1||a!==1)&&(s+=`scale(${r}, ${a})`),s||"none"}const Ya=(t,e)=>t.depth-e.depth;class Qa{constructor(){this.children=[],this.isDirty=!1}add(e){Je(this.children,e),this.isDirty=!0}remove(e){tn(this.children,e),this.isDirty=!0}forEach(e){this.isDirty&&this.children.sort(Ya),this.isDirty=!1,this.children.forEach(e)}}function Ja(t,e){const n=performance.now(),s=({timestamp:i})=>{const o=i-n;o>=e&&(_(s),t(o-e))};return T.read(s,!0),()=>_(s)}function tc(t){window.MotionDebug&&window.MotionDebug.record(t)}function ec(t){return t instanceof SVGElement&&t.tagName!=="svg"}function nc(t,e,n){const s=O(t)?t:kt(t);return s.start(Qe("",s,e,n)),s.animation}const Yn=["","X","Y","Z"],sc={visibility:"hidden"},Qn=1e3;let ic=0;const ot={type:"projectionFrame",totalNodes:0,resolvedTargetDeltas:0,recalculatedProjection:0};function Ci({attachResizeListener:t,defaultParent:e,measureScroll:n,checkIsScrollRoot:s,resetTransform:i}){return class{constructor(r={},a=e==null?void 0:e()){this.id=ic++,this.animationId=0,this.children=new Set,this.options={},this.isTreeAnimating=!1,this.isAnimationBlocked=!1,this.isLayoutDirty=!1,this.isProjectionDirty=!1,this.isSharedProjectionDirty=!1,this.isTransformDirty=!1,this.updateManuallyBlocked=!1,this.updateBlockedByResize=!1,this.isUpdating=!1,this.isSVG=!1,this.needsReset=!1,this.shouldResetTransform=!1,this.treeScale={x:1,y:1},this.eventHandlers=new Map,this.hasTreeAnimated=!1,this.updateScheduled=!1,this.projectionUpdateScheduled=!1,this.checkUpdateFailed=()=>{this.isUpdating&&(this.isUpdating=!1,this.clearAllSnapshots())},this.updateProjection=()=>{this.projectionUpdateScheduled=!1,ot.totalNodes=ot.resolvedTargetDeltas=ot.recalculatedProjection=0,this.nodes.forEach(ac),this.nodes.forEach(dc),this.nodes.forEach(yc),this.nodes.forEach(cc),tc(ot)},this.hasProjected=!1,this.isVisible=!0,this.animationProgress=0,this.sharedNodes=new Map,this.latestValues=r,this.root=a?a.root||a:this,this.path=a?[...a.path,a]:[],this.parent=a,this.depth=a?a.depth+1:0;for(let c=0;c<this.path.length;c++)this.path[c].shouldResetTransform=!0;this.root===this&&(this.nodes=new Qa)}addEventListener(r,a){return this.eventHandlers.has(r)||this.eventHandlers.set(r,new en),this.eventHandlers.get(r).add(a)}notifyListeners(r,...a){const c=this.eventHandlers.get(r);c&&c.notify(...a)}hasListeners(r){return this.eventHandlers.has(r)}mount(r,a=this.root.hasTreeAnimated){if(this.instance)return;this.isSVG=ec(r),this.instance=r;const{layoutId:c,layout:l,visualElement:h}=this.options;if(h&&!h.current&&h.mount(r),this.root.nodes.add(this),this.parent&&this.parent.children.add(this),a&&(l||c)&&(this.isLayoutDirty=!0),t){let u;const y=()=>this.root.updateBlockedByResize=!1;t(r,()=>{this.root.updateBlockedByResize=!0,u&&u(),u=Ja(y,250),Wt.hasAnimatedSinceResize&&(Wt.hasAnimatedSinceResize=!1,this.nodes.forEach(ts))})}c&&this.root.registerSharedNode(c,this),this.options.animate!==!1&&h&&(c||l)&&this.addEventListener("didUpdate",({delta:u,hasLayoutChanged:y,hasRelativeTargetChanged:f,layout:p})=>{if(this.isTreeAnimationBlocked()){this.target=void 0,this.relativeTarget=void 0;return}const m=this.options.transition||h.getDefaultTransition()||xc,{onLayoutAnimationStart:v,onLayoutAnimationComplete:b}=h.getProps(),k=!this.targetLayout||!Vi(this.targetLayout,p)||f,g=!y&&f;if(this.options.layoutRoot||this.resumeFrom&&this.resumeFrom.instance||g||y&&(k||!this.currentAnimation)){this.resumeFrom&&(this.resumingFrom=this.resumeFrom,this.resumingFrom.resumingFrom=void 0),this.setAnimationOrigin(u,g);const M={...Ye(m,"layout"),onPlay:v,onComplete:b};(h.shouldReduceMotion||this.options.layoutRoot)&&(M.delay=0,M.type=!1),this.startAnimation(M)}else y||ts(this),this.isLead()&&this.options.onExitComplete&&this.options.onExitComplete();this.targetLayout=p})}unmount(){this.options.layoutId&&this.willUpdate(),this.root.nodes.remove(this);const r=this.getStack();r&&r.remove(this),this.parent&&this.parent.children.delete(this),this.instance=void 0,_(this.updateProjection)}blockUpdate(){this.updateManuallyBlocked=!0}unblockUpdate(){this.updateManuallyBlocked=!1}isUpdateBlocked(){return this.updateManuallyBlocked||this.updateBlockedByResize}isTreeAnimationBlocked(){return this.isAnimationBlocked||this.parent&&this.parent.isTreeAnimationBlocked()||!1}startUpdate(){this.isUpdateBlocked()||(this.isUpdating=!0,this.nodes&&this.nodes.forEach(fc),this.animationId++)}getTransformTemplate(){const{visualElement:r}=this.options;return r&&r.getProps().transformTemplate}willUpdate(r=!0){if(this.root.hasTreeAnimated=!0,this.root.isUpdateBlocked()){this.options.onExitComplete&&this.options.onExitComplete();return}if(!this.root.isUpdating&&this.root.startUpdate(),this.isLayoutDirty)return;this.isLayoutDirty=!0;for(let h=0;h<this.path.length;h++){const u=this.path[h];u.shouldResetTransform=!0,u.updateScroll("snapshot"),u.options.layoutRoot&&u.willUpdate(!1)}const{layoutId:a,layout:c}=this.options;if(a===void 0&&!c)return;const l=this.getTransformTemplate();this.prevTransformTemplateValue=l?l(this.latestValues,""):void 0,this.updateSnapshot(),r&&this.notifyListeners("willUpdate")}update(){if(this.updateScheduled=!1,this.isUpdateBlocked()){this.unblockUpdate(),this.clearAllSnapshots(),this.nodes.forEach(Jn);return}this.isUpdating||this.nodes.forEach(hc),this.isUpdating=!1,this.nodes.forEach(uc),this.nodes.forEach(rc),this.nodes.forEach(oc),this.clearAllSnapshots();const a=performance.now();F.delta=tt(0,1e3/60,a-F.timestamp),F.timestamp=a,F.isProcessing=!0,ce.update.process(F),ce.preRender.process(F),ce.render.process(F),F.isProcessing=!1}didUpdate(){this.updateScheduled||(this.updateScheduled=!0,queueMicrotask(()=>this.update()))}clearAllSnapshots(){this.nodes.forEach(lc),this.sharedNodes.forEach(pc)}scheduleUpdateProjection(){this.projectionUpdateScheduled||(this.projectionUpdateScheduled=!0,T.preRender(this.updateProjection,!1,!0))}scheduleCheckAfterUnmount(){T.postRender(()=>{this.isLayoutDirty?this.root.didUpdate():this.root.checkUpdateFailed()})}updateSnapshot(){this.snapshot||!this.instance||(this.snapshot=this.measure())}updateLayout(){if(!this.instance||(this.updateScroll(),!(this.options.alwaysMeasureLayout&&this.isLead())&&!this.isLayoutDirty))return;if(this.resumeFrom&&!this.resumeFrom.instance)for(let c=0;c<this.path.length;c++)this.path[c].updateScroll();const r=this.layout;this.layout=this.measure(!1),this.layoutCorrected=j(),this.isLayoutDirty=!1,this.projectionDelta=void 0,this.notifyListeners("measure",this.layout.layoutBox);const{visualElement:a}=this.options;a&&a.notify("LayoutMeasure",this.layout.layoutBox,r?r.layoutBox:void 0)}updateScroll(r="measure"){let a=!!(this.options.layoutScroll&&this.instance);this.scroll&&this.scroll.animationId===this.root.animationId&&this.scroll.phase===r&&(a=!1),a&&(this.scroll={animationId:this.root.animationId,phase:r,isRoot:s(this.instance),offset:n(this.instance)})}resetTransform(){if(!i)return;const r=this.isLayoutDirty||this.shouldResetTransform,a=this.projectionDelta&&!Pi(this.projectionDelta),c=this.getTransformTemplate(),l=c?c(this.latestValues,""):void 0,h=l!==this.prevTransformTemplateValue;r&&(a||rt(this.latestValues)||h)&&(i(this.instance,l),this.shouldResetTransform=!1,this.scheduleRender())}measure(r=!0){const a=this.measurePageBox();let c=this.removeElementScroll(a);return r&&(c=this.removeTransform(c)),kc(c),{animationId:this.root.animationId,measuredBox:a,layoutBox:c,latestValues:{},source:this.id}}measurePageBox(){const{visualElement:r}=this.options;if(!r)return j();const a=r.measureViewportBox(),{scroll:c}=this.root;return c&&(Q(a.x,c.offset.x),Q(a.y,c.offset.y)),a}removeElementScroll(r){const a=j();I(a,r);for(let c=0;c<this.path.length;c++){const l=this.path[c],{scroll:h,options:u}=l;if(l!==this.root&&h&&u.layoutScroll){if(h.isRoot){I(a,r);const{scroll:y}=this.root;y&&(Q(a.x,-y.offset.x),Q(a.y,-y.offset.y))}Q(a.x,h.offset.x),Q(a.y,h.offset.y)}}return a}applyTransform(r,a=!1){const c=j();I(c,r);for(let l=0;l<this.path.length;l++){const h=this.path[l];!a&&h.options.layoutScroll&&h.scroll&&h!==h.root&&xt(c,{x:-h.scroll.offset.x,y:-h.scroll.offset.y}),rt(h.latestValues)&&xt(c,h.latestValues)}return rt(this.latestValues)&&xt(c,this.latestValues),c}removeTransform(r){const a=j();I(a,r);for(let c=0;c<this.path.length;c++){const l=this.path[c];if(!l.instance||!rt(l.latestValues))continue;Le(l.latestValues)&&l.updateSnapshot();const h=j(),u=l.measurePageBox();I(h,u),$n(a,l.latestValues,l.snapshot?l.snapshot.layoutBox:void 0,h)}return rt(this.latestValues)&&$n(a,this.latestValues),a}setTargetDelta(r){this.targetDelta=r,this.root.scheduleUpdateProjection(),this.isProjectionDirty=!0}setOptions(r){this.options={...this.options,...r,crossfade:r.crossfade!==void 0?r.crossfade:!0}}clearMeasurements(){this.scroll=void 0,this.layout=void 0,this.snapshot=void 0,this.prevTransformTemplateValue=void 0,this.targetDelta=void 0,this.target=void 0,this.isLayoutDirty=!1}forceRelativeParentToResolveTarget(){this.relativeParent&&this.relativeParent.resolvedRelativeTargetAt!==F.timestamp&&this.relativeParent.resolveTargetDelta(!0)}resolveTargetDelta(r=!1){var a;const c=this.getLead();this.isProjectionDirty||(this.isProjectionDirty=c.isProjectionDirty),this.isTransformDirty||(this.isTransformDirty=c.isTransformDirty),this.isSharedProjectionDirty||(this.isSharedProjectionDirty=c.isSharedProjectionDirty);const l=!!this.resumingFrom||this!==c;if(!(r||l&&this.isSharedProjectionDirty||this.isProjectionDirty||!((a=this.parent)===null||a===void 0)&&a.isProjectionDirty||this.attemptToResolveRelativeTarget))return;const{layout:u,layoutId:y}=this.options;if(!(!this.layout||!(u||y))){if(this.resolvedRelativeTargetAt=F.timestamp,!this.targetDelta&&!this.relativeTarget){const f=this.getClosestProjectingParent();f&&f.layout&&this.animationProgress!==1?(this.relativeParent=f,this.forceRelativeParentToResolveTarget(),this.relativeTarget=j(),this.relativeTargetOrigin=j(),Lt(this.relativeTargetOrigin,this.layout.layoutBox,f.layout.layoutBox),I(this.relativeTarget,this.relativeTargetOrigin)):this.relativeParent=this.relativeTarget=void 0}if(!(!this.relativeTarget&&!this.targetDelta)){if(this.target||(this.target=j(),this.targetWithTransforms=j()),this.relativeTarget&&this.relativeTargetOrigin&&this.relativeParent&&this.relativeParent.target?(this.forceRelativeParentToResolveTarget(),va(this.target,this.relativeTarget,this.relativeParent.target)):this.targetDelta?(this.resumingFrom?this.target=this.applyTransform(this.layout.layoutBox):I(this.target,this.layout.layoutBox),xi(this.target,this.targetDelta)):I(this.target,this.layout.layoutBox),this.attemptToResolveRelativeTarget){this.attemptToResolveRelativeTarget=!1;const f=this.getClosestProjectingParent();f&&!!f.resumingFrom==!!this.resumingFrom&&!f.options.layoutScroll&&f.target&&this.animationProgress!==1?(this.relativeParent=f,this.forceRelativeParentToResolveTarget(),this.relativeTarget=j(),this.relativeTargetOrigin=j(),Lt(this.relativeTargetOrigin,this.target,f.target),I(this.relativeTarget,this.relativeTargetOrigin)):this.relativeParent=this.relativeTarget=void 0}ot.resolvedTargetDeltas++}}}getClosestProjectingParent(){if(!(!this.parent||Le(this.parent.latestValues)||gi(this.parent.latestValues)))return this.parent.isProjecting()?this.parent:this.parent.getClosestProjectingParent()}isProjecting(){return!!((this.relativeTarget||this.targetDelta||this.options.layoutRoot)&&this.layout)}calcProjection(){var r;const a=this.getLead(),c=!!this.resumingFrom||this!==a;let l=!0;if((this.isProjectionDirty||!((r=this.parent)===null||r===void 0)&&r.isProjectionDirty)&&(l=!1),c&&(this.isSharedProjectionDirty||this.isTransformDirty)&&(l=!1),this.resolvedRelativeTargetAt===F.timestamp&&(l=!1),l)return;const{layout:h,layoutId:u}=this.options;if(this.isTreeAnimating=!!(this.parent&&this.parent.isTreeAnimating||this.currentAnimation||this.pendingAnimation),this.isTreeAnimating||(this.targetDelta=this.relativeTarget=void 0),!this.layout||!(h||u))return;I(this.layoutCorrected,this.layout.layoutBox);const y=this.treeScale.x,f=this.treeScale.y;Aa(this.layoutCorrected,this.treeScale,this.path,c),a.layout&&!a.target&&(this.treeScale.x!==1||this.treeScale.y!==1)&&(a.target=a.layout.layoutBox);const{target:p}=a;if(!p){this.projectionTransform&&(this.projectionDelta=gt(),this.projectionTransform="none",this.scheduleRender());return}this.projectionDelta||(this.projectionDelta=gt(),this.projectionDeltaWithTransform=gt());const m=this.projectionTransform;At(this.projectionDelta,this.layoutCorrected,p,this.latestValues),this.projectionTransform=Xn(this.projectionDelta,this.treeScale),(this.projectionTransform!==m||this.treeScale.x!==y||this.treeScale.y!==f)&&(this.hasProjected=!0,this.scheduleRender(),this.notifyListeners("projectionUpdate",p)),ot.recalculatedProjection++}hide(){this.isVisible=!1}show(){this.isVisible=!0}scheduleRender(r=!0){if(this.options.scheduleRender&&this.options.scheduleRender(),r){const a=this.getStack();a&&a.scheduleRender()}this.resumingFrom&&!this.resumingFrom.instance&&(this.resumingFrom=void 0)}setAnimationOrigin(r,a=!1){const c=this.snapshot,l=c?c.latestValues:{},h={...this.latestValues},u=gt();(!this.relativeParent||!this.relativeParent.options.layoutRoot)&&(this.relativeTarget=this.relativeTargetOrigin=void 0),this.attemptToResolveRelativeTarget=!a;const y=j(),f=c?c.source:void 0,p=this.layout?this.layout.source:void 0,m=f!==p,v=this.getStack(),b=!v||v.members.length<=1,k=!!(m&&!b&&this.options.crossfade===!0&&!this.path.some(gc));this.animationProgress=0;let g;this.mixTargetDelta=M=>{const P=M/1e3;es(u.x,r.x,P),es(u.y,r.y,P),this.setTargetDelta(u),this.relativeTarget&&this.relativeTargetOrigin&&this.layout&&this.relativeParent&&this.relativeParent.layout&&(Lt(y,this.layout.layoutBox,this.relativeParent.layout.layoutBox),mc(this.relativeTarget,this.relativeTargetOrigin,y,P),g&&_a(this.relativeTarget,g)&&(this.isProjectionDirty=!1),g||(g=j()),I(g,this.relativeTarget)),m&&(this.animationValues=h,Na(h,l,this.latestValues,P,k,b)),this.root.scheduleUpdateProjection(),this.scheduleRender(),this.animationProgress=P},this.mixTargetDelta(this.options.layoutRoot?1e3:0)}startAnimation(r){this.notifyListeners("animationStart"),this.currentAnimation&&this.currentAnimation.stop(),this.resumingFrom&&this.resumingFrom.currentAnimation&&this.resumingFrom.currentAnimation.stop(),this.pendingAnimation&&(_(this.pendingAnimation),this.pendingAnimation=void 0),this.pendingAnimation=T.update(()=>{Wt.hasAnimatedSinceResize=!0,this.currentAnimation=nc(0,Qn,{...r,onUpdate:a=>{this.mixTargetDelta(a),r.onUpdate&&r.onUpdate(a)},onComplete:()=>{r.onComplete&&r.onComplete(),this.completeAnimation()}}),this.resumingFrom&&(this.resumingFrom.currentAnimation=this.currentAnimation),this.pendingAnimation=void 0})}completeAnimation(){this.resumingFrom&&(this.resumingFrom.currentAnimation=void 0,this.resumingFrom.preserveOpacity=void 0);const r=this.getStack();r&&r.exitAnimationComplete(),this.resumingFrom=this.currentAnimation=this.animationValues=void 0,this.notifyListeners("animationComplete")}finishAnimation(){this.currentAnimation&&(this.mixTargetDelta&&this.mixTargetDelta(Qn),this.currentAnimation.stop()),this.completeAnimation()}applyTransformsToTarget(){const r=this.getLead();let{targetWithTransforms:a,target:c,layout:l,latestValues:h}=r;if(!(!a||!c||!l)){if(this!==r&&this.layout&&l&&Ti(this.options.animationType,this.layout.layoutBox,l.layoutBox)){c=this.target||j();const u=H(this.layout.layoutBox.x);c.x.min=r.target.x.min,c.x.max=c.x.min+u;const y=H(this.layout.layoutBox.y);c.y.min=r.target.y.min,c.y.max=c.y.min+y}I(a,c),xt(a,h),At(this.projectionDeltaWithTransform,this.layoutCorrected,a,h)}}registerSharedNode(r,a){this.sharedNodes.has(r)||this.sharedNodes.set(r,new Xa),this.sharedNodes.get(r).add(a);const l=a.options.initialPromotionConfig;a.promote({transition:l?l.transition:void 0,preserveFollowOpacity:l&&l.shouldPreserveFollowOpacity?l.shouldPreserveFollowOpacity(a):void 0})}isLead(){const r=this.getStack();return r?r.lead===this:!0}getLead(){var r;const{layoutId:a}=this.options;return a?((r=this.getStack())===null||r===void 0?void 0:r.lead)||this:this}getPrevLead(){var r;const{layoutId:a}=this.options;return a?(r=this.getStack())===null||r===void 0?void 0:r.prevLead:void 0}getStack(){const{layoutId:r}=this.options;if(r)return this.root.sharedNodes.get(r)}promote({needsReset:r,transition:a,preserveFollowOpacity:c}={}){const l=this.getStack();l&&l.promote(this,c),r&&(this.projectionDelta=void 0,this.needsReset=!0),a&&this.setOptions({transition:a})}relegate(){const r=this.getStack();return r?r.relegate(this):!1}resetRotation(){const{visualElement:r}=this.options;if(!r)return;let a=!1;const{latestValues:c}=r;if((c.rotate||c.rotateX||c.rotateY||c.rotateZ)&&(a=!0),!a)return;const l={};for(let h=0;h<Yn.length;h++){const u="rotate"+Yn[h];c[u]&&(l[u]=c[u],r.setStaticValue(u,0))}r.render();for(const h in l)r.setStaticValue(h,l[h]);r.scheduleRender()}getProjectionStyles(r){var a,c;if(!this.instance||this.isSVG)return;if(!this.isVisible)return sc;const l={visibility:""},h=this.getTransformTemplate();if(this.needsReset)return this.needsReset=!1,l.opacity="",l.pointerEvents=Nt(r==null?void 0:r.pointerEvents)||"",l.transform=h?h(this.latestValues,""):"none",l;const u=this.getLead();if(!this.projectionDelta||!this.layout||!u.target){const m={};return this.options.layoutId&&(m.opacity=this.latestValues.opacity!==void 0?this.latestValues.opacity:1,m.pointerEvents=Nt(r==null?void 0:r.pointerEvents)||""),this.hasProjected&&!rt(this.latestValues)&&(m.transform=h?h({},""):"none",this.hasProjected=!1),m}const y=u.animationValues||u.latestValues;this.applyTransformsToTarget(),l.transform=Xn(this.projectionDeltaWithTransform,this.treeScale,y),h&&(l.transform=h(y,l.transform));const{x:f,y:p}=this.projectionDelta;l.transformOrigin=`${f.origin*100}% ${p.origin*100}% 0`,u.animationValues?l.opacity=u===this?(c=(a=y.opacity)!==null&&a!==void 0?a:this.latestValues.opacity)!==null&&c!==void 0?c:1:this.preserveOpacity?this.latestValues.opacity:y.opacityExit:l.opacity=u===this?y.opacity!==void 0?y.opacity:"":y.opacityExit!==void 0?y.opacityExit:0;for(const m in Gt){if(y[m]===void 0)continue;const{correct:v,applyTo:b}=Gt[m],k=l.transform==="none"?y[m]:v(y[m],u);if(b){const g=b.length;for(let M=0;M<g;M++)l[b[M]]=k}else l[m]=k}return this.options.layoutId&&(l.pointerEvents=u===this?Nt(r==null?void 0:r.pointerEvents)||"":"none"),l}clearSnapshot(){this.resumeFrom=this.snapshot=void 0}resetTree(){this.root.nodes.forEach(r=>{var a;return(a=r.currentAnimation)===null||a===void 0?void 0:a.stop()}),this.root.nodes.forEach(Jn),this.root.sharedNodes.clear()}}}function rc(t){t.updateLayout()}function oc(t){var e;const n=((e=t.resumeFrom)===null||e===void 0?void 0:e.snapshot)||t.snapshot;if(t.isLead()&&t.layout&&n&&t.hasListeners("didUpdate")){const{layoutBox:s,measuredBox:i}=t.layout,{animationType:o}=t.options,r=n.source!==t.layout.source;o==="size"?U(u=>{const y=r?n.measuredBox[u]:n.layoutBox[u],f=H(y);y.min=s[u].min,y.max=y.min+f}):Ti(o,n.layoutBox,s)&&U(u=>{const y=r?n.measuredBox[u]:n.layoutBox[u],f=H(s[u]);y.max=y.min+f,t.relativeTarget&&!t.currentAnimation&&(t.isProjectionDirty=!0,t.relativeTarget[u].max=t.relativeTarget[u].min+f)});const a=gt();At(a,s,n.layoutBox);const c=gt();r?At(c,t.applyTransform(i,!0),n.measuredBox):At(c,s,n.layoutBox);const l=!Pi(a);let h=!1;if(!t.resumeFrom){const u=t.getClosestProjectingParent();if(u&&!u.resumeFrom){const{snapshot:y,layout:f}=u;if(y&&f){const p=j();Lt(p,n.layoutBox,y.layoutBox);const m=j();Lt(m,s,f.layoutBox),Vi(p,m)||(h=!0),u.options.layoutRoot&&(t.relativeTarget=m,t.relativeTargetOrigin=p,t.relativeParent=u)}}}t.notifyListeners("didUpdate",{layout:s,snapshot:n,delta:c,layoutDelta:a,hasLayoutChanged:l,hasRelativeTargetChanged:h})}else if(t.isLead()){const{onExitComplete:s}=t.options;s&&s()}t.options.transition=void 0}function ac(t){ot.totalNodes++,t.parent&&(t.isProjecting()||(t.isProjectionDirty=t.parent.isProjectionDirty),t.isSharedProjectionDirty||(t.isSharedProjectionDirty=!!(t.isProjectionDirty||t.parent.isProjectionDirty||t.parent.isSharedProjectionDirty)),t.isTransformDirty||(t.isTransformDirty=t.parent.isTransformDirty))}function cc(t){t.isProjectionDirty=t.isSharedProjectionDirty=t.isTransformDirty=!1}function lc(t){t.clearSnapshot()}function Jn(t){t.clearMeasurements()}function hc(t){t.isLayoutDirty=!1}function uc(t){const{visualElement:e}=t.options;e&&e.getProps().onBeforeLayoutMeasure&&e.notify("BeforeLayoutMeasure"),t.resetTransform()}function ts(t){t.finishAnimation(),t.targetDelta=t.relativeTarget=t.target=void 0,t.isProjectionDirty=!0}function dc(t){t.resolveTargetDelta()}function yc(t){t.calcProjection()}function fc(t){t.resetRotation()}function pc(t){t.removeLeadSnapshot()}function es(t,e,n){t.translate=D(e.translate,0,n),t.scale=D(e.scale,1,n),t.origin=e.origin,t.originPoint=e.originPoint}function ns(t,e,n,s){t.min=D(e.min,n.min,s),t.max=D(e.max,n.max,s)}function mc(t,e,n,s){ns(t.x,e.x,n.x,s),ns(t.y,e.y,n.y,s)}function gc(t){return t.animationValues&&t.animationValues.opacityExit!==void 0}const xc={duration:.45,ease:[.4,0,.1,1]},ss=t=>typeof navigator<"u"&&navigator.userAgent.toLowerCase().includes(t),is=ss("applewebkit/")&&!ss("chrome/")?Math.round:R;function rs(t){t.min=is(t.min),t.max=is(t.max)}function kc(t){rs(t.x),rs(t.y)}function Ti(t,e,n){return t==="position"||t==="preserve-aspect"&&!Se(_n(e),_n(n),.2)}const vc=Ci({attachResizeListener:(t,e)=>Z(t,"resize",e),measureScroll:()=>({x:document.documentElement.scrollLeft||document.body.scrollLeft,y:document.documentElement.scrollTop||document.body.scrollTop}),checkIsScrollRoot:()=>!0}),ke={current:void 0},Si=Ci({measureScroll:t=>({x:t.scrollLeft,y:t.scrollTop}),defaultParent:()=>{if(!ke.current){const t=new vc({});t.mount(window),t.setOptions({layoutScroll:!0}),ke.current=t}return ke.current},resetTransform:(t,e)=>{t.style.transform=e!==void 0?e:"none"},checkIsScrollRoot:t=>window.getComputedStyle(t).position==="fixed"}),Mc={pan:{Feature:za},drag:{Feature:Ea,ProjectionNode:Si,MeasureLayout:Mi}},bc=/var\((--[a-zA-Z0-9-_]+),? ?([a-zA-Z0-9 ()%#.,-]+)?\)/;function wc(t){const e=bc.exec(t);if(!e)return[,];const[,n,s]=e;return[n,s]}function Re(t,e,n=1){const[s,i]=wc(t);if(!s)return;const o=window.getComputedStyle(e).getPropertyValue(s);if(o){const r=o.trim();return hi(r)?parseFloat(r):r}else return Me(i)?Re(i,e,n+1):i}function Pc(t,{...e},n){const s=t.current;if(!(s instanceof Element))return{target:e,transitionEnd:n};n&&(n={...n}),t.values.forEach(i=>{const o=i.get();if(!Me(o))return;const r=Re(o,s);r&&i.set(r)});for(const i in e){const o=e[i];if(!Me(o))continue;const r=Re(o,s);r&&(e[i]=r,n||(n={}),n[i]===void 0&&(n[i]=o))}return{target:e,transitionEnd:n}}const Vc=new Set(["width","height","top","left","right","bottom","x","y","translateX","translateY"]),Ai=t=>Vc.has(t),Cc=t=>Object.keys(t).some(Ai),os=t=>t===ut||t===w,as=(t,e)=>parseFloat(t.split(", ")[e]),cs=(t,e)=>(n,{transform:s})=>{if(s==="none"||!s)return 0;const i=s.match(/^matrix3d\((.+)\)$/);if(i)return as(i[1],e);{const o=s.match(/^matrix\((.+)\)$/);return o?as(o[1],t):0}},Tc=new Set(["x","y","z"]),Sc=Bt.filter(t=>!Tc.has(t));function Ac(t){const e=[];return Sc.forEach(n=>{const s=t.getValue(n);s!==void 0&&(e.push([n,s.get()]),s.set(n.startsWith("scale")?1:0))}),e.length&&t.render(),e}const vt={width:({x:t},{paddingLeft:e="0",paddingRight:n="0"})=>t.max-t.min-parseFloat(e)-parseFloat(n),height:({y:t},{paddingTop:e="0",paddingBottom:n="0"})=>t.max-t.min-parseFloat(e)-parseFloat(n),top:(t,{top:e})=>parseFloat(e),left:(t,{left:e})=>parseFloat(e),bottom:({y:t},{top:e})=>parseFloat(e)+(t.max-t.min),right:({x:t},{left:e})=>parseFloat(e)+(t.max-t.min),x:cs(4,13),y:cs(5,14)};vt.translateX=vt.x;vt.translateY=vt.y;const Lc=(t,e,n)=>{const s=e.measureViewportBox(),i=e.current,o=getComputedStyle(i),{display:r}=o,a={};r==="none"&&e.setStaticValue("display",t.display||"block"),n.forEach(l=>{a[l]=vt[l](s,o)}),e.render();const c=e.measureViewportBox();return n.forEach(l=>{const h=e.getValue(l);h&&h.jump(a[l]),t[l]=vt[l](c,o)}),t},Dc=(t,e,n={},s={})=>{e={...e},s={...s};const i=Object.keys(e).filter(Ai);let o=[],r=!1;const a=[];if(i.forEach(c=>{const l=t.getValue(c);if(!t.hasValue(c))return;let h=n[c],u=Pt(h);const y=e[c];let f;if($t(y)){const p=y.length,m=y[0]===null?1:0;h=y[m],u=Pt(h);for(let v=m;v<p&&y[v]!==null;v++)f?Ze(Pt(y[v])===f):f=Pt(y[v])}else f=Pt(y);if(u!==f)if(os(u)&&os(f)){const p=l.get();typeof p=="string"&&l.set(parseFloat(p)),typeof y=="string"?e[c]=parseFloat(y):Array.isArray(y)&&f===w&&(e[c]=y.map(parseFloat))}else u!=null&&u.transform&&(f!=null&&f.transform)&&(h===0||y===0)?h===0?l.set(f.transform(h)):e[c]=u.transform(y):(r||(o=Ac(t),r=!0),a.push(c),s[c]=s[c]!==void 0?s[c]:e[c],l.jump(y))}),a.length){const c=a.indexOf("height")>=0?window.pageYOffset:null,l=Lc(e,t,a);return o.length&&o.forEach(([h,u])=>{t.getValue(h).set(u)}),t.render(),ee&&c!==null&&window.scrollTo({top:c}),{target:l,transitionEnd:s}}else return{target:e,transitionEnd:s}};function Rc(t,e,n,s){return Cc(e)?Dc(t,e,n,s):{target:e,transitionEnd:s}}const jc=(t,e,n,s)=>{const i=Pc(t,e,s);return e=i.target,s=i.transitionEnd,Rc(t,e,n,s)},je={current:null},Li={current:!1};function Bc(){if(Li.current=!0,!!ee)if(window.matchMedia){const t=window.matchMedia("(prefers-reduced-motion)"),e=()=>je.current=t.matches;t.addListener(e),e()}else je.current=!1}function Fc(t,e,n){const{willChange:s}=e;for(const i in e){const o=e[i],r=n[i];if(O(o))t.addValue(i,o),Yt(s)&&s.add(i);else if(O(r))t.addValue(i,kt(o,{owner:t})),Yt(s)&&s.remove(i);else if(r!==o)if(t.hasValue(i)){const a=t.getValue(i);!a.hasAnimated&&a.set(o)}else{const a=t.getStaticValue(i);t.addValue(i,kt(a!==void 0?a:o,{owner:t}))}}for(const i in n)e[i]===void 0&&t.removeValue(i);return e}const ls=new WeakMap,Di=Object.keys(Rt),Ec=Di.length,hs=["AnimationStart","AnimationComplete","Update","BeforeLayoutMeasure","LayoutMeasure","LayoutAnimationStart","LayoutAnimationComplete"],zc=ze.length;class Oc{constructor({parent:e,props:n,presenceContext:s,reducedMotionConfig:i,visualState:o},r={}){this.current=null,this.children=new Set,this.isVariantNode=!1,this.isControllingVariants=!1,this.shouldReduceMotion=null,this.values=new Map,this.features={},this.valueSubscriptions=new Map,this.prevMotionValues={},this.events={},this.propEventSubscriptions={},this.notifyUpdate=()=>this.notify("Update",this.latestValues),this.render=()=>{this.current&&(this.triggerBuild(),this.renderInstance(this.current,this.renderState,this.props.style,this.projection))},this.scheduleRender=()=>T.render(this.render,!1,!0);const{latestValues:a,renderState:c}=o;this.latestValues=a,this.baseTarget={...a},this.initialValues=n.initial?{...a}:{},this.renderState=c,this.parent=e,this.props=n,this.presenceContext=s,this.depth=e?e.depth+1:0,this.reducedMotionConfig=i,this.options=r,this.isControllingVariants=se(n),this.isVariantNode=ps(n),this.isVariantNode&&(this.variantChildren=new Set),this.manuallyAnimateOnMount=!!(e&&e.current);const{willChange:l,...h}=this.scrapeMotionValuesFromProps(n,{});for(const u in h){const y=h[u];a[u]!==void 0&&O(y)&&(y.set(a[u],!1),Yt(l)&&l.add(u))}}scrapeMotionValuesFromProps(e,n){return{}}mount(e){this.current=e,ls.set(e,this),this.projection&&!this.projection.instance&&this.projection.mount(e),this.parent&&this.isVariantNode&&!this.isControllingVariants&&(this.removeFromVariantTree=this.parent.addVariantChild(this)),this.values.forEach((n,s)=>this.bindToMotionValue(s,n)),Li.current||Bc(),this.shouldReduceMotion=this.reducedMotionConfig==="never"?!1:this.reducedMotionConfig==="always"?!0:je.current,this.parent&&this.parent.children.add(this),this.update(this.props,this.presenceContext)}unmount(){ls.delete(this.current),this.projection&&this.projection.unmount(),_(this.notifyUpdate),_(this.render),this.valueSubscriptions.forEach(e=>e()),this.removeFromVariantTree&&this.removeFromVariantTree(),this.parent&&this.parent.children.delete(this);for(const e in this.events)this.events[e].clear();for(const e in this.features)this.features[e].unmount();this.current=null}bindToMotionValue(e,n){const s=ht.has(e),i=n.on("change",r=>{this.latestValues[e]=r,this.props.onUpdate&&T.update(this.notifyUpdate,!1,!0),s&&this.projection&&(this.projection.isTransformDirty=!0)}),o=n.on("renderRequest",this.scheduleRender);this.valueSubscriptions.set(e,()=>{i(),o()})}sortNodePosition(e){return!this.current||!this.sortInstanceNodePosition||this.type!==e.type?0:this.sortInstanceNodePosition(this.current,e.current)}loadFeatures({children:e,...n},s,i,o){let r,a;for(let c=0;c<Ec;c++){const l=Di[c],{isEnabled:h,Feature:u,ProjectionNode:y,MeasureLayout:f}=Rt[l];y&&(r=y),h(n)&&(!this.features[l]&&u&&(this.features[l]=new u(this)),f&&(a=f))}if((this.type==="html"||this.type==="svg")&&!this.projection&&r){this.projection=new r(this.latestValues,this.parent&&this.parent.projection);const{layoutId:c,layout:l,drag:h,dragConstraints:u,layoutScroll:y,layoutRoot:f}=n;this.projection.setOptions({layoutId:c,layout:l,alwaysMeasureLayout:!!h||u&&pt(u),visualElement:this,scheduleRender:()=>this.scheduleRender(),animationType:typeof l=="string"?l:"both",initialPromotionConfig:o,layoutScroll:y,layoutRoot:f})}return a}updateFeatures(){for(const e in this.features){const n=this.features[e];n.isMounted?n.update():(n.mount(),n.isMounted=!0)}}triggerBuild(){this.build(this.renderState,this.latestValues,this.options,this.props)}measureViewportBox(){return this.current?this.measureInstanceViewportBox(this.current,this.props):j()}getStaticValue(e){return this.latestValues[e]}setStaticValue(e,n){this.latestValues[e]=n}makeTargetAnimatable(e,n=!0){return this.makeTargetAnimatableFromInstance(e,this.props,n)}update(e,n){(e.transformTemplate||this.props.transformTemplate)&&this.scheduleRender(),this.prevProps=this.props,this.props=e,this.prevPresenceContext=this.presenceContext,this.presenceContext=n;for(let s=0;s<hs.length;s++){const i=hs[s];this.propEventSubscriptions[i]&&(this.propEventSubscriptions[i](),delete this.propEventSubscriptions[i]);const o=e["on"+i];o&&(this.propEventSubscriptions[i]=this.on(i,o))}this.prevMotionValues=Fc(this,this.scrapeMotionValuesFromProps(e,this.prevProps),this.prevMotionValues),this.handleChildMotionValue&&this.handleChildMotionValue()}getProps(){return this.props}getVariant(e){return this.props.variants?this.props.variants[e]:void 0}getDefaultTransition(){return this.props.transition}getTransformPagePoint(){return this.props.transformPagePoint}getClosestVariantNode(){return this.isVariantNode?this:this.parent?this.parent.getClosestVariantNode():void 0}getVariantContext(e=!1){if(e)return this.parent?this.parent.getVariantContext():void 0;if(!this.isControllingVariants){const s=this.parent?this.parent.getVariantContext()||{}:{};return this.props.initial!==void 0&&(s.initial=this.props.initial),s}const n={};for(let s=0;s<zc;s++){const i=ze[s],o=this.props[i];(Dt(o)||o===!1)&&(n[i]=o)}return n}addVariantChild(e){const n=this.getClosestVariantNode();if(n)return n.variantChildren&&n.variantChildren.add(e),()=>n.variantChildren.delete(e)}addValue(e,n){n!==this.values.get(e)&&(this.removeValue(e),this.bindToMotionValue(e,n)),this.values.set(e,n),this.latestValues[e]=n.get()}removeValue(e){this.values.delete(e);const n=this.valueSubscriptions.get(e);n&&(n(),this.valueSubscriptions.delete(e)),delete this.latestValues[e],this.removeValueFromRenderState(e,this.renderState)}hasValue(e){return this.values.has(e)}getValue(e,n){if(this.props.values&&this.props.values[e])return this.props.values[e];let s=this.values.get(e);return s===void 0&&n!==void 0&&(s=kt(n,{owner:this}),this.addValue(e,s)),s}readValue(e){var n;return this.latestValues[e]!==void 0||!this.current?this.latestValues[e]:(n=this.getBaseTargetFromProps(this.props,e))!==null&&n!==void 0?n:this.readValueFromInstance(this.current,e,this.options)}setBaseTarget(e,n){this.baseTarget[e]=n}getBaseTarget(e){var n;const{initial:s}=this.props,i=typeof s=="string"||typeof s=="object"?(n=Ge(this.props,s))===null||n===void 0?void 0:n[e]:void 0;if(s&&i!==void 0)return i;const o=this.getBaseTargetFromProps(this.props,e);return o!==void 0&&!O(o)?o:this.initialValues[e]!==void 0&&i===void 0?void 0:this.baseTarget[e]}on(e,n){return this.events[e]||(this.events[e]=new en),this.events[e].add(n)}notify(e,...n){this.events[e]&&this.events[e].notify(...n)}}class Ri extends Oc{sortInstanceNodePosition(e,n){return e.compareDocumentPosition(n)&2?1:-1}getBaseTargetFromProps(e,n){return e.style?e.style[n]:void 0}removeValueFromRenderState(e,{vars:n,style:s}){delete n[e],delete s[e]}makeTargetAnimatableFromInstance({transition:e,transitionEnd:n,...s},{transformValues:i},o){let r=ea(s,e||{},this);if(i&&(n&&(n=i(n)),s&&(s=i(s)),r&&(r=i(r))),o){Jo(this,s,r);const a=jc(this,s,r,n);n=a.transitionEnd,s=a.target}return{transition:e,transitionEnd:n,...s}}}function Hc(t){return window.getComputedStyle(t)}class qc extends Ri{constructor(){super(...arguments),this.type="html"}readValueFromInstance(e,n){if(ht.has(n)){const s=Xe(n);return s&&s.default||0}else{const s=Hc(e),i=(ks(n)?s.getPropertyValue(n):s[n])||0;return typeof i=="string"?i.trim():i}}measureInstanceViewportBox(e,{transformPagePoint:n}){return ki(e,n)}build(e,n,s,i){qe(e,n,s,i.transformTemplate)}scrapeMotionValuesFromProps(e,n){return We(e,n)}handleChildMotionValue(){this.childSubscription&&(this.childSubscription(),delete this.childSubscription);const{children:e}=this.props;O(e)&&(this.childSubscription=e.on("change",n=>{this.current&&(this.current.textContent=`${n}`)}))}renderInstance(e,n,s,i){Vs(e,n,s,i)}}class Ic extends Ri{constructor(){super(...arguments),this.type="svg",this.isSVGTag=!1}getBaseTargetFromProps(e,n){return e[n]}readValueFromInstance(e,n){if(ht.has(n)){const s=Xe(n);return s&&s.default||0}return n=Cs.has(n)?n:Fe(n),e.getAttribute(n)}measureInstanceViewportBox(){return j()}scrapeMotionValuesFromProps(e,n){return Ss(e,n)}build(e,n,s,i){Ue(e,n,s,this.isSVGTag,i.transformTemplate)}renderInstance(e,n,s,i){Ts(e,n,s,i)}mount(e){this.isSVGTag=Ne(e.tagName),super.mount(e)}}const Uc=(t,e)=>He(t)?new Ic(e,{enableHardwareAcceleration:!1}):new qc(e,{enableHardwareAcceleration:!0}),Nc={layout:{ProjectionNode:Si,MeasureLayout:Mi}},Wc={...ma,...Fr,...Mc,...Nc},sl=Wi((t,e)=>br(t,e,Wc,Uc));function ji(){const t=x.useRef(!1);return Be(()=>(t.current=!0,()=>{t.current=!1}),[]),t}function Gc(){const t=ji(),[e,n]=x.useState(0),s=x.useCallback(()=>{t.current&&n(e+1)},[e]);return[x.useCallback(()=>T.postRender(s),[s]),e]}class Zc extends x.Component{getSnapshotBeforeUpdate(e){const n=this.props.childRef.current;if(n&&e.isPresent&&!this.props.isPresent){const s=this.props.sizeRef.current;s.height=n.offsetHeight||0,s.width=n.offsetWidth||0,s.top=n.offsetTop,s.left=n.offsetLeft}return null}componentDidUpdate(){}render(){return this.props.children}}function $c({children:t,isPresent:e}){const n=x.useId(),s=x.useRef(null),i=x.useRef({width:0,height:0,top:0,left:0});return x.useInsertionEffect(()=>{const{width:o,height:r,top:a,left:c}=i.current;if(e||!s.current||!o||!r)return;s.current.dataset.motionPopId=n;const l=document.createElement("style");return document.head.appendChild(l),l.sheet&&l.sheet.insertRule(`
          [data-motion-pop-id="${n}"] {
            position: absolute !important;
            width: ${o}px !important;
            height: ${r}px !important;
            top: ${a}px !important;
            left: ${c}px !important;
          }
        `),()=>{document.head.removeChild(l)}},[e]),x.createElement(Zc,{isPresent:e,childRef:s,sizeRef:i},x.cloneElement(t,{ref:s}))}const ve=({children:t,initial:e,isPresent:n,onExitComplete:s,custom:i,presenceAffectsLayout:o,mode:r})=>{const a=As(Kc),c=x.useId(),l=x.useMemo(()=>({id:c,initial:e,isPresent:n,custom:i,onExitComplete:h=>{a.set(h,!0);for(const u of a.values())if(!u)return;s&&s()},register:h=>(a.set(h,!1),()=>a.delete(h))}),o?void 0:[n]);return x.useMemo(()=>{a.forEach((h,u)=>a.set(u,!1))},[n]),x.useEffect(()=>{!n&&!a.size&&s&&s()},[n]),r==="popLayout"&&(t=x.createElement($c,{isPresent:n},t)),x.createElement(te.Provider,{value:l},t)};function Kc(){return new Map}function _c(t){return x.useEffect(()=>()=>t(),[])}const at=t=>t.key||"";function Xc(t,e){t.forEach(n=>{const s=at(n);e.set(s,n)})}function Yc(t){const e=[];return x.Children.forEach(t,n=>{x.isValidElement(n)&&e.push(n)}),e}const il=({children:t,custom:e,initial:n=!0,onExitComplete:s,exitBeforeEnter:i,presenceAffectsLayout:o=!0,mode:r="sync"})=>{const a=x.useContext(Oe).forceRender||Gc()[0],c=ji(),l=Yc(t);let h=l;const u=x.useRef(new Map).current,y=x.useRef(h),f=x.useRef(new Map).current,p=x.useRef(!0);if(Be(()=>{p.current=!1,Xc(l,f),y.current=h}),_c(()=>{p.current=!0,f.clear(),u.clear()}),p.current)return x.createElement(x.Fragment,null,h.map(k=>x.createElement(ve,{key:at(k),isPresent:!0,initial:n?void 0:!1,presenceAffectsLayout:o,mode:r},k)));h=[...h];const m=y.current.map(at),v=l.map(at),b=m.length;for(let k=0;k<b;k++){const g=m[k];v.indexOf(g)===-1&&!u.has(g)&&u.set(g,void 0)}return r==="wait"&&u.size&&(h=[]),u.forEach((k,g)=>{if(v.indexOf(g)!==-1)return;const M=f.get(g);if(!M)return;const P=m.indexOf(g);let S=k;if(!S){const A=()=>{u.delete(g);const V=Array.from(f.keys()).filter(C=>!v.includes(C));if(V.forEach(C=>f.delete(C)),y.current=l.filter(C=>{const q=at(C);return q===g||V.includes(q)}),!u.size){if(c.current===!1)return;a(),s&&s()}};S=x.createElement(ve,{key:at(M),isPresent:!1,onExitComplete:A,custom:e,presenceAffectsLayout:o,mode:r},M),u.set(g,S)}h.splice(P,0,S)}),h=h.map(k=>{const g=k.key;return u.has(g)?k:x.createElement(ve,{key:at(k),isPresent:!0,presenceAffectsLayout:o,mode:r},k)}),x.createElement(x.Fragment,null,u.size?h:h.map(k=>x.cloneElement(k)))};/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var Qc={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jc=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase().trim(),d=(t,e)=>{const n=x.forwardRef(({color:s="currentColor",size:i=24,strokeWidth:o=2,absoluteStrokeWidth:r,className:a="",children:c,...l},h)=>x.createElement("svg",{ref:h,...Qc,width:i,height:i,stroke:s,strokeWidth:r?Number(o)*24/Number(i):o,className:["lucide",`lucide-${Jc(t)}`,a].join(" "),...l},[...e.map(([u,y])=>x.createElement(u,y)),...Array.isArray(c)?c:[c]]));return n.displayName=`${t}`,n};/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rl=d("Activity",[["path",{d:"M22 12h-4l-3 9L9 3l-3 9H2",key:"d5dnw9"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ol=d("AlertCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"12",x2:"12",y1:"8",y2:"12",key:"1pkeuh"}],["line",{x1:"12",x2:"12.01",y1:"16",y2:"16",key:"4dfq90"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const al=d("AlertTriangle",[["path",{d:"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",key:"c3ski4"}],["path",{d:"M12 9v4",key:"juzpu7"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cl=d("AlignCenter",[["line",{x1:"21",x2:"3",y1:"6",y2:"6",key:"1fp77t"}],["line",{x1:"17",x2:"7",y1:"12",y2:"12",key:"rsh8ii"}],["line",{x1:"19",x2:"5",y1:"18",y2:"18",key:"1t0tuv"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ll=d("AlignJustify",[["line",{x1:"3",x2:"21",y1:"6",y2:"6",key:"4m8b97"}],["line",{x1:"3",x2:"21",y1:"12",y2:"12",key:"10d38w"}],["line",{x1:"3",x2:"21",y1:"18",y2:"18",key:"kwyyxn"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hl=d("AlignLeft",[["line",{x1:"21",x2:"3",y1:"6",y2:"6",key:"1fp77t"}],["line",{x1:"15",x2:"3",y1:"12",y2:"12",key:"v6grx8"}],["line",{x1:"17",x2:"3",y1:"18",y2:"18",key:"1awlsn"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ul=d("AlignRight",[["line",{x1:"21",x2:"3",y1:"6",y2:"6",key:"1fp77t"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}],["line",{x1:"21",x2:"7",y1:"18",y2:"18",key:"1g9eri"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dl=d("Archive",[["rect",{width:"20",height:"5",x:"2",y:"3",rx:"1",key:"1wp1u1"}],["path",{d:"M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8",key:"1s80jp"}],["path",{d:"M10 12h4",key:"a56b0p"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yl=d("ArrowDownRight",[["path",{d:"m7 7 10 10",key:"1fmybs"}],["path",{d:"M17 7v10H7",key:"6fjiku"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fl=d("ArrowDown",[["path",{d:"M12 5v14",key:"s699le"}],["path",{d:"m19 12-7 7-7-7",key:"1idqje"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pl=d("ArrowLeft",[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ml=d("ArrowRight",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gl=d("ArrowUpRight",[["path",{d:"M7 7h10v10",key:"1tivn9"}],["path",{d:"M7 17 17 7",key:"1vkiza"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xl=d("ArrowUp",[["path",{d:"m5 12 7-7 7 7",key:"hav0vg"}],["path",{d:"M12 19V5",key:"x0mq9r"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const kl=d("Award",[["circle",{cx:"12",cy:"8",r:"6",key:"1vp47v"}],["path",{d:"M15.477 12.89 17 22l-5-3-5 3 1.523-9.11",key:"em7aur"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vl=d("Banknote",[["rect",{width:"20",height:"12",x:"2",y:"6",rx:"2",key:"9lu3g6"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}],["path",{d:"M6 12h.01M18 12h.01",key:"113zkx"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ml=d("BarChart2",[["line",{x1:"18",x2:"18",y1:"20",y2:"10",key:"1xfpm4"}],["line",{x1:"12",x2:"12",y1:"20",y2:"4",key:"be30l9"}],["line",{x1:"6",x2:"6",y1:"20",y2:"14",key:"1r4le6"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bl=d("BarChart3",[["path",{d:"M3 3v18h18",key:"1s2lah"}],["path",{d:"M18 17V9",key:"2bz60n"}],["path",{d:"M13 17V5",key:"1frdt8"}],["path",{d:"M8 17v-3",key:"17ska0"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wl=d("BatteryMedium",[["rect",{width:"16",height:"10",x:"2",y:"7",rx:"2",ry:"2",key:"1w10f2"}],["line",{x1:"22",x2:"22",y1:"11",y2:"13",key:"4dh1rd"}],["line",{x1:"6",x2:"6",y1:"11",y2:"13",key:"1wd6dw"}],["line",{x1:"10",x2:"10",y1:"11",y2:"13",key:"haxvl5"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pl=d("Bell",[["path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9",key:"1qo2s2"}],["path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0",key:"qgo35s"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vl=d("Bold",[["path",{d:"M14 12a4 4 0 0 0 0-8H6v8",key:"v2sylx"}],["path",{d:"M15 20a4 4 0 0 0 0-8H6v8Z",key:"1ef5ya"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Cl=d("BookOpen",[["path",{d:"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z",key:"vv98re"}],["path",{d:"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z",key:"1cyq3y"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tl=d("Book",[["path",{d:"M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20",key:"t4utmx"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Sl=d("Bot",[["path",{d:"M12 8V4H8",key:"hb8ula"}],["rect",{width:"16",height:"12",x:"4",y:"8",rx:"2",key:"enze0r"}],["path",{d:"M2 14h2",key:"vft8re"}],["path",{d:"M20 14h2",key:"4cs60a"}],["path",{d:"M15 13v2",key:"1xurst"}],["path",{d:"M9 13v2",key:"rq6x2g"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Al=d("Box",[["path",{d:"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",key:"hh9hay"}],["path",{d:"m3.3 7 8.7 5 8.7-5",key:"g66t2b"}],["path",{d:"M12 22V12",key:"d0xqtd"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ll=d("Brain",[["path",{d:"M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z",key:"1mhkh5"}],["path",{d:"M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z",key:"1d6s00"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Dl=d("Briefcase",[["rect",{width:"20",height:"14",x:"2",y:"7",rx:"2",ry:"2",key:"eto64e"}],["path",{d:"M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",key:"zwj3tp"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rl=d("Building2",[["path",{d:"M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z",key:"1b4qmf"}],["path",{d:"M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2",key:"i71pzd"}],["path",{d:"M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2",key:"10jefs"}],["path",{d:"M10 6h4",key:"1itunk"}],["path",{d:"M10 10h4",key:"tcdvrf"}],["path",{d:"M10 14h4",key:"kelpxr"}],["path",{d:"M10 18h4",key:"1ulq68"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jl=d("Building",[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",ry:"2",key:"76otgf"}],["path",{d:"M9 22v-4h6v4",key:"r93iot"}],["path",{d:"M8 6h.01",key:"1dz90k"}],["path",{d:"M16 6h.01",key:"1x0f13"}],["path",{d:"M12 6h.01",key:"1vi96p"}],["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M16 14h.01",key:"1gbofw"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M8 14h.01",key:"6423bh"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bl=d("Calculator",[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",key:"1nb95v"}],["line",{x1:"8",x2:"16",y1:"6",y2:"6",key:"x4nwl0"}],["line",{x1:"16",x2:"16",y1:"14",y2:"18",key:"wjye3r"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M8 18h.01",key:"lrp35t"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fl=d("CalendarDays",[["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",ry:"2",key:"eu3xkr"}],["line",{x1:"16",x2:"16",y1:"2",y2:"6",key:"m3sa8f"}],["line",{x1:"8",x2:"8",y1:"2",y2:"6",key:"18kwsl"}],["line",{x1:"3",x2:"21",y1:"10",y2:"10",key:"xt86sb"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M16 14h.01",key:"1gbofw"}],["path",{d:"M8 18h.01",key:"lrp35t"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M16 18h.01",key:"kzsmim"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const El=d("Calendar",[["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",ry:"2",key:"eu3xkr"}],["line",{x1:"16",x2:"16",y1:"2",y2:"6",key:"m3sa8f"}],["line",{x1:"8",x2:"8",y1:"2",y2:"6",key:"18kwsl"}],["line",{x1:"3",x2:"21",y1:"10",y2:"10",key:"xt86sb"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zl=d("Camera",[["path",{d:"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",key:"1tc9qg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ol=d("Car",[["path",{d:"M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2",key:"5owen"}],["circle",{cx:"7",cy:"17",r:"2",key:"u2ysq9"}],["path",{d:"M9 17h6",key:"r8uit2"}],["circle",{cx:"17",cy:"17",r:"2",key:"axvx0g"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Hl=d("CheckCheck",[["path",{d:"M18 6 7 17l-5-5",key:"116fxf"}],["path",{d:"m22 10-7.5 7.5L13 16",key:"ke71qq"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ql=d("CheckCircle2",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Il=d("CheckCircle",[["path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14",key:"g774vq"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ul=d("CheckSquare",[["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}],["path",{d:"M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",key:"1jnkn4"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nl=d("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wl=d("ChevronDown",[["path",{d:"m6 9 6 6 6-6",key:"qrunsl"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gl=d("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zl=d("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $l=d("ChevronUp",[["path",{d:"m18 15-6-6-6 6",key:"153udz"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Kl=d("CircleUser",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}],["path",{d:"M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662",key:"154egf"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _l=d("Circle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xl=d("ClipboardCheck",[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",key:"116196"}],["path",{d:"m9 14 2 2 4-4",key:"df797q"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yl=d("ClipboardList",[["rect",{width:"8",height:"4",x:"8",y:"2",rx:"1",ry:"1",key:"tgr4d6"}],["path",{d:"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",key:"116196"}],["path",{d:"M12 11h4",key:"1jrz19"}],["path",{d:"M12 16h4",key:"n85exb"}],["path",{d:"M8 11h.01",key:"1dfujw"}],["path",{d:"M8 16h.01",key:"18s6g9"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ql=d("Clock",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polyline",{points:"12 6 12 12 16 14",key:"68esgv"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jl=d("CloudOff",[["path",{d:"m2 2 20 20",key:"1ooewy"}],["path",{d:"M5.782 5.782A7 7 0 0 0 9 19h8.5a4.5 4.5 0 0 0 1.307-.193",key:"yfwify"}],["path",{d:"M21.532 16.5A4.5 4.5 0 0 0 17.5 10h-1.79A7.008 7.008 0 0 0 10 5.07",key:"jlfiyv"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const t1=d("Cloud",[["path",{d:"M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z",key:"p7xjir"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const e1=d("Code",[["polyline",{points:"16 18 22 12 16 6",key:"z7tu5w"}],["polyline",{points:"8 6 2 12 8 18",key:"1eg1df"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n1=d("Columns",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["line",{x1:"12",x2:"12",y1:"3",y2:"21",key:"1efggb"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const s1=d("Command",[["path",{d:"M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3",key:"11bfej"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i1=d("Copy",[["rect",{width:"14",height:"14",x:"8",y:"8",rx:"2",ry:"2",key:"17jyea"}],["path",{d:"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",key:"zix9uf"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r1=d("CreditCard",[["rect",{width:"20",height:"14",x:"2",y:"5",rx:"2",key:"ynyp8z"}],["line",{x1:"2",x2:"22",y1:"10",y2:"10",key:"1b3vmo"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o1=d("Crown",[["path",{d:"m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14",key:"zkxr6b"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const a1=d("Database",[["ellipse",{cx:"12",cy:"5",rx:"9",ry:"3",key:"msslwz"}],["path",{d:"M3 5V19A9 3 0 0 0 21 19V5",key:"1wlel7"}],["path",{d:"M3 12A9 3 0 0 0 21 12",key:"mv7ke4"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c1=d("DollarSign",[["line",{x1:"12",x2:"12",y1:"2",y2:"22",key:"7eqyqh"}],["path",{d:"M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",key:"1b0p4s"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l1=d("Download",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"7 10 12 15 17 10",key:"2ggqvy"}],["line",{x1:"12",x2:"12",y1:"15",y2:"3",key:"1vk2je"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h1=d("Eraser",[["path",{d:"m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21",key:"182aya"}],["path",{d:"M22 21H7",key:"t4ddhn"}],["path",{d:"m5 11 9 9",key:"1mo9qw"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u1=d("ExternalLink",[["path",{d:"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",key:"a6xqqp"}],["polyline",{points:"15 3 21 3 21 9",key:"mznyad"}],["line",{x1:"10",x2:"21",y1:"14",y2:"3",key:"18c3s4"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d1=d("EyeOff",[["path",{d:"M9.88 9.88a3 3 0 1 0 4.24 4.24",key:"1jxqfv"}],["path",{d:"M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68",key:"9wicm4"}],["path",{d:"M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61",key:"1jreej"}],["line",{x1:"2",x2:"22",y1:"2",y2:"22",key:"a6p6uj"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y1=d("Eye",[["path",{d:"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z",key:"rwhkz3"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f1=d("FileBarChart",[["path",{d:"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",key:"1nnpy2"}],["polyline",{points:"14 2 14 8 20 8",key:"1ew0cm"}],["path",{d:"M12 18v-4",key:"q1q25u"}],["path",{d:"M8 18v-2",key:"qcmpov"}],["path",{d:"M16 18v-6",key:"15y0np"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p1=d("FileCheck",[["path",{d:"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",key:"1nnpy2"}],["polyline",{points:"14 2 14 8 20 8",key:"1ew0cm"}],["path",{d:"m9 15 2 2 4-4",key:"1grp1n"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m1=d("FileDown",[["path",{d:"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",key:"1nnpy2"}],["polyline",{points:"14 2 14 8 20 8",key:"1ew0cm"}],["path",{d:"M12 18v-6",key:"17g6i2"}],["path",{d:"m9 15 3 3 3-3",key:"1npd3o"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const g1=d("FileEdit",[["path",{d:"M4 13.5V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-5.5",key:"1bg6eb"}],["polyline",{points:"14 2 14 8 20 8",key:"1ew0cm"}],["path",{d:"M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l.99-3.95 5.43-5.44Z",key:"1rgxu8"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x1=d("FileSignature",[["path",{d:"M20 19.5v.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8.5L18 5.5",key:"kd5d3"}],["path",{d:"M8 18h1",key:"13wk12"}],["path",{d:"M18.42 9.61a2.1 2.1 0 1 1 2.97 2.97L16.95 17 13 18l.99-3.95 4.43-4.44Z",key:"johvi5"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k1=d("FileSpreadsheet",[["path",{d:"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",key:"1nnpy2"}],["polyline",{points:"14 2 14 8 20 8",key:"1ew0cm"}],["path",{d:"M8 13h2",key:"yr2amv"}],["path",{d:"M8 17h2",key:"2yhykz"}],["path",{d:"M14 13h2",key:"un5t4a"}],["path",{d:"M14 17h2",key:"10kma7"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v1=d("FileText",[["path",{d:"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",key:"1nnpy2"}],["polyline",{points:"14 2 14 8 20 8",key:"1ew0cm"}],["line",{x1:"16",x2:"8",y1:"13",y2:"13",key:"14keom"}],["line",{x1:"16",x2:"8",y1:"17",y2:"17",key:"17nazh"}],["line",{x1:"10",x2:"8",y1:"9",y2:"9",key:"1a5vjj"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M1=d("File",[["path",{d:"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z",key:"1nnpy2"}],["polyline",{points:"14 2 14 8 20 8",key:"1ew0cm"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const b1=d("Filter",[["polygon",{points:"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3",key:"1yg77f"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const w1=d("Flag",[["path",{d:"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z",key:"i9b6wo"}],["line",{x1:"4",x2:"4",y1:"22",y2:"15",key:"1cm3nv"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const P1=d("FolderKanban",[["path",{d:"M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z",key:"1fr9dc"}],["path",{d:"M8 10v4",key:"tgpxqk"}],["path",{d:"M12 10v2",key:"hh53o1"}],["path",{d:"M16 10v6",key:"1d6xys"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V1=d("FolderOpen",[["path",{d:"m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",key:"usdka0"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C1=d("FolderPlus",[["path",{d:"M12 10v6",key:"1bos4e"}],["path",{d:"M9 13h6",key:"1uhe8q"}],["path",{d:"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",key:"1kt360"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T1=d("Folder",[["path",{d:"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",key:"1kt360"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S1=d("Frown",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M16 16s-1.5-2-4-2-4 2-4 2",key:"epbg0q"}],["line",{x1:"9",x2:"9.01",y1:"9",y2:"9",key:"yxxnd0"}],["line",{x1:"15",x2:"15.01",y1:"9",y2:"9",key:"1p4y9e"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A1=d("Gem",[["path",{d:"M6 3h12l4 6-10 13L2 9Z",key:"1pcd5k"}],["path",{d:"M11 3 8 9l4 13 4-13-3-6",key:"1fcu3u"}],["path",{d:"M2 9h20",key:"16fsjt"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L1=d("Gift",[["rect",{x:"3",y:"8",width:"18",height:"4",rx:"1",key:"bkv52"}],["path",{d:"M12 8v13",key:"1c76mn"}],["path",{d:"M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7",key:"6wjy6b"}],["path",{d:"M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5",key:"1ihvrl"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D1=d("GitBranch",[["line",{x1:"6",x2:"6",y1:"3",y2:"15",key:"17qcm7"}],["circle",{cx:"18",cy:"6",r:"3",key:"1h7g24"}],["circle",{cx:"6",cy:"18",r:"3",key:"fqmcym"}],["path",{d:"M18 9a9 9 0 0 1-9 9",key:"n2h4wq"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R1=d("Globe",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j1=d("Grid3x3",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M3 9h18",key:"1pudct"}],["path",{d:"M3 15h18",key:"5xshup"}],["path",{d:"M9 3v18",key:"fh3hqa"}],["path",{d:"M15 3v18",key:"14nvp0"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B1=d("GripVertical",[["circle",{cx:"9",cy:"12",r:"1",key:"1vctgf"}],["circle",{cx:"9",cy:"5",r:"1",key:"hp0tcf"}],["circle",{cx:"9",cy:"19",r:"1",key:"fkjjf6"}],["circle",{cx:"15",cy:"12",r:"1",key:"1tmaij"}],["circle",{cx:"15",cy:"5",r:"1",key:"19l28e"}],["circle",{cx:"15",cy:"19",r:"1",key:"f4zoj3"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F1=d("Hash",[["line",{x1:"4",x2:"20",y1:"9",y2:"9",key:"4lhtct"}],["line",{x1:"4",x2:"20",y1:"15",y2:"15",key:"vyu0kd"}],["line",{x1:"10",x2:"8",y1:"3",y2:"21",key:"1ggp8o"}],["line",{x1:"16",x2:"14",y1:"3",y2:"21",key:"weycgp"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E1=d("Heading1",[["path",{d:"M4 12h8",key:"17cfdx"}],["path",{d:"M4 18V6",key:"1rz3zl"}],["path",{d:"M12 18V6",key:"zqpxq5"}],["path",{d:"m17 12 3-2v8",key:"1hhhft"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z1=d("Heading2",[["path",{d:"M4 12h8",key:"17cfdx"}],["path",{d:"M4 18V6",key:"1rz3zl"}],["path",{d:"M12 18V6",key:"zqpxq5"}],["path",{d:"M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1",key:"9jr5yi"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const O1=d("Heading3",[["path",{d:"M4 12h8",key:"17cfdx"}],["path",{d:"M4 18V6",key:"1rz3zl"}],["path",{d:"M12 18V6",key:"zqpxq5"}],["path",{d:"M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2",key:"68ncm8"}],["path",{d:"M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2",key:"1ejuhz"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H1=d("Heart",[["path",{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",key:"c3ymky"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q1=d("HelpCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",key:"1u773s"}],["path",{d:"M12 17h.01",key:"p32p05"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I1=d("Highlighter",[["path",{d:"m9 11-6 6v3h9l3-3",key:"1a3l36"}],["path",{d:"m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4",key:"14a9rk"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U1=d("History",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N1=d("Home",[["path",{d:"m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",key:"y5dka4"}],["polyline",{points:"9 22 9 12 15 12 15 22",key:"e2us08"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const W1=d("ImagePlus",[["path",{d:"M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7",key:"31hg93"}],["line",{x1:"16",x2:"22",y1:"5",y2:"5",key:"ez7e4s"}],["line",{x1:"19",x2:"19",y1:"2",y2:"8",key:"1gkr8c"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const G1=d("Image",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["circle",{cx:"9",cy:"9",r:"2",key:"af1f0g"}],["path",{d:"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",key:"1xmnt7"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Z1=d("Inbox",[["polyline",{points:"22 12 16 12 14 15 10 15 8 12 2 12",key:"o97t9d"}],["path",{d:"M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",key:"oot6mr"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $1=d("Info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const K1=d("Italic",[["line",{x1:"19",x2:"10",y1:"4",y2:"4",key:"15jd3p"}],["line",{x1:"14",x2:"5",y1:"20",y2:"20",key:"bu0au3"}],["line",{x1:"15",x2:"9",y1:"4",y2:"20",key:"uljnxc"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _1=d("Key",[["circle",{cx:"7.5",cy:"15.5",r:"5.5",key:"yqb3hr"}],["path",{d:"m21 2-9.6 9.6",key:"1j0ho8"}],["path",{d:"m15.5 7.5 3 3L22 7l-3-3",key:"1rn1fs"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const X1=d("Layers",[["path",{d:"m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z",key:"8b97xw"}],["path",{d:"m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65",key:"dd6zsq"}],["path",{d:"m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65",key:"ep9fru"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Y1=d("LayoutDashboard",[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q1=d("LayoutGrid",[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1",key:"6d4xhi"}],["rect",{width:"7",height:"7",x:"14",y:"14",rx:"1",key:"nxv5o0"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const J1=d("Layout",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["line",{x1:"3",x2:"21",y1:"9",y2:"9",key:"1vqk6q"}],["line",{x1:"9",x2:"9",y1:"21",y2:"9",key:"wpwpyp"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const th=d("Library",[["path",{d:"m16 6 4 14",key:"ji33uf"}],["path",{d:"M12 6v14",key:"1n7gus"}],["path",{d:"M8 8v12",key:"1gg7y9"}],["path",{d:"M4 4v16",key:"6qkkli"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const eh=d("Lightbulb",[["path",{d:"M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",key:"1gvzjb"}],["path",{d:"M9 18h6",key:"x1upvd"}],["path",{d:"M10 22h4",key:"ceow96"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const nh=d("LineChart",[["path",{d:"M3 3v18h18",key:"1s2lah"}],["path",{d:"m19 9-5 5-4-4-3 3",key:"2osh9i"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const sh=d("Link",[["path",{d:"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",key:"1cjeqo"}],["path",{d:"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",key:"19qd67"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ih=d("ListFilter",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M7 12h10",key:"b7w52i"}],["path",{d:"M10 18h4",key:"1ulq68"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const rh=d("ListOrdered",[["line",{x1:"10",x2:"21",y1:"6",y2:"6",key:"76qw6h"}],["line",{x1:"10",x2:"21",y1:"12",y2:"12",key:"16nom4"}],["line",{x1:"10",x2:"21",y1:"18",y2:"18",key:"u3jurt"}],["path",{d:"M4 6h1v4",key:"cnovpq"}],["path",{d:"M4 10h2",key:"16xx2s"}],["path",{d:"M6 18H4c0-1 2-2 2-3s-1-1.5-2-1",key:"m9a95d"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oh=d("List",[["line",{x1:"8",x2:"21",y1:"6",y2:"6",key:"7ey8pc"}],["line",{x1:"8",x2:"21",y1:"12",y2:"12",key:"rjfblc"}],["line",{x1:"8",x2:"21",y1:"18",y2:"18",key:"c3b1m8"}],["line",{x1:"3",x2:"3.01",y1:"6",y2:"6",key:"1g7gq3"}],["line",{x1:"3",x2:"3.01",y1:"12",y2:"12",key:"1pjlvk"}],["line",{x1:"3",x2:"3.01",y1:"18",y2:"18",key:"28t2mc"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ah=d("Loader2",[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ch=d("Loader",[["line",{x1:"12",x2:"12",y1:"2",y2:"6",key:"gza1u7"}],["line",{x1:"12",x2:"12",y1:"18",y2:"22",key:"1qhbu9"}],["line",{x1:"4.93",x2:"7.76",y1:"4.93",y2:"7.76",key:"xae44r"}],["line",{x1:"16.24",x2:"19.07",y1:"16.24",y2:"19.07",key:"bxnmvf"}],["line",{x1:"2",x2:"6",y1:"12",y2:"12",key:"89khin"}],["line",{x1:"18",x2:"22",y1:"12",y2:"12",key:"pb8tfm"}],["line",{x1:"4.93",x2:"7.76",y1:"19.07",y2:"16.24",key:"1uxjnu"}],["line",{x1:"16.24",x2:"19.07",y1:"7.76",y2:"4.93",key:"6duxfx"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const lh=d("Lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hh=d("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const uh=d("Mail",[["rect",{width:"20",height:"16",x:"2",y:"4",rx:"2",key:"18n3k1"}],["path",{d:"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7",key:"1ocrg3"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const dh=d("MapPin",[["path",{d:"M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z",key:"2oe9fu"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yh=d("Map",[["polygon",{points:"3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21",key:"ok2ie8"}],["line",{x1:"9",x2:"9",y1:"3",y2:"18",key:"w34qz5"}],["line",{x1:"15",x2:"15",y1:"6",y2:"21",key:"volv9a"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fh=d("Maximize2",[["polyline",{points:"15 3 21 3 21 9",key:"mznyad"}],["polyline",{points:"9 21 3 21 3 15",key:"1avn1i"}],["line",{x1:"21",x2:"14",y1:"3",y2:"10",key:"ota7mn"}],["line",{x1:"3",x2:"10",y1:"21",y2:"14",key:"1atl0r"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ph=d("Medal",[["path",{d:"M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15",key:"143lza"}],["path",{d:"M11 12 5.12 2.2",key:"qhuxz6"}],["path",{d:"m13 12 5.88-9.8",key:"hbye0f"}],["path",{d:"M8 7h8",key:"i86dvs"}],["circle",{cx:"12",cy:"17",r:"5",key:"qbz8iq"}],["path",{d:"M12 18v-2h-.5",key:"fawc4q"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mh=d("Meh",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"8",x2:"16",y1:"15",y2:"15",key:"1xb1d9"}],["line",{x1:"9",x2:"9.01",y1:"9",y2:"9",key:"yxxnd0"}],["line",{x1:"15",x2:"15.01",y1:"9",y2:"9",key:"1p4y9e"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gh=d("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xh=d("MessageCircle",[["path",{d:"m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z",key:"v2veuj"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const kh=d("MessageSquarePlus",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}],["line",{x1:"9",x2:"15",y1:"10",y2:"10",key:"1lj1wd"}],["line",{x1:"12",x2:"12",y1:"7",y2:"13",key:"1cppfj"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vh=d("MessageSquare",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mh=d("MicOff",[["line",{x1:"2",x2:"22",y1:"2",y2:"22",key:"a6p6uj"}],["path",{d:"M18.89 13.23A7.12 7.12 0 0 0 19 12v-2",key:"80xlxr"}],["path",{d:"M5 10v2a7 7 0 0 0 12 5",key:"p2k8kg"}],["path",{d:"M15 9.34V5a3 3 0 0 0-5.68-1.33",key:"1gzdoj"}],["path",{d:"M9 9v3a3 3 0 0 0 5.12 2.12",key:"r2i35w"}],["line",{x1:"12",x2:"12",y1:"19",y2:"22",key:"x3vr5v"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bh=d("Mic",[["path",{d:"M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z",key:"131961"}],["path",{d:"M19 10v2a7 7 0 0 1-14 0v-2",key:"1vc78b"}],["line",{x1:"12",x2:"12",y1:"19",y2:"22",key:"x3vr5v"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wh=d("Minimize2",[["polyline",{points:"4 14 10 14 10 20",key:"11kfnr"}],["polyline",{points:"20 10 14 10 14 4",key:"rlmsce"}],["line",{x1:"14",x2:"21",y1:"10",y2:"3",key:"o5lafz"}],["line",{x1:"3",x2:"10",y1:"21",y2:"14",key:"1atl0r"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ph=d("Minus",[["path",{d:"M5 12h14",key:"1ays0h"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vh=d("Monitor",[["rect",{width:"20",height:"14",x:"2",y:"3",rx:"2",key:"48i651"}],["line",{x1:"8",x2:"16",y1:"21",y2:"21",key:"1svkeh"}],["line",{x1:"12",x2:"12",y1:"17",y2:"21",key:"vw1qmm"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ch=d("Moon",[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Th=d("MoreVertical",[["circle",{cx:"12",cy:"12",r:"1",key:"41hilf"}],["circle",{cx:"12",cy:"5",r:"1",key:"gxeob9"}],["circle",{cx:"12",cy:"19",r:"1",key:"lyex9k"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Sh=d("Move",[["polyline",{points:"5 9 2 12 5 15",key:"1r5uj5"}],["polyline",{points:"9 5 12 2 15 5",key:"5v383o"}],["polyline",{points:"15 19 12 22 9 19",key:"g7qi8m"}],["polyline",{points:"19 9 22 12 19 15",key:"tpp73q"}],["line",{x1:"2",x2:"22",y1:"12",y2:"12",key:"1dnqot"}],["line",{x1:"12",x2:"12",y1:"2",y2:"22",key:"7eqyqh"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ah=d("Navigation",[["polygon",{points:"3 11 22 2 13 21 11 13 3 11",key:"1ltx0t"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Lh=d("Package",[["path",{d:"m7.5 4.27 9 5.15",key:"1c824w"}],["path",{d:"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",key:"hh9hay"}],["path",{d:"m3.3 7 8.7 5 8.7-5",key:"g66t2b"}],["path",{d:"M12 22V12",key:"d0xqtd"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Dh=d("Paintbrush",[["path",{d:"M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z",key:"m6k5sh"}],["path",{d:"M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7",key:"arzq70"}],["path",{d:"M14.5 17.5 4.5 15",key:"s7fvrz"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Rh=d("Palette",[["circle",{cx:"13.5",cy:"6.5",r:".5",key:"1xcu5"}],["circle",{cx:"17.5",cy:"10.5",r:".5",key:"736e4u"}],["circle",{cx:"8.5",cy:"7.5",r:".5",key:"clrty"}],["circle",{cx:"6.5",cy:"12.5",r:".5",key:"1s4xz9"}],["path",{d:"M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z",key:"12rzf8"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const jh=d("PanelRightClose",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["line",{x1:"15",x2:"15",y1:"3",y2:"21",key:"1hpv9i"}],["path",{d:"m8 9 3 3-3 3",key:"12hl5m"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bh=d("PanelRightOpen",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",ry:"2",key:"1m3agn"}],["line",{x1:"15",x2:"15",y1:"3",y2:"21",key:"1hpv9i"}],["path",{d:"m10 15-3-3 3-3",key:"1pgupc"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fh=d("Paperclip",[["path",{d:"m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48",key:"1u3ebp"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Eh=d("PauseCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["line",{x1:"10",x2:"10",y1:"15",y2:"9",key:"c1nkhi"}],["line",{x1:"14",x2:"14",y1:"15",y2:"9",key:"h65svq"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zh=d("Pause",[["rect",{width:"4",height:"16",x:"6",y:"4",key:"iffhe4"}],["rect",{width:"4",height:"16",x:"14",y:"4",key:"sjin7j"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Oh=d("PenLine",[["path",{d:"M12 20h9",key:"t2du7b"}],["path",{d:"M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z",key:"ymcmye"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Hh=d("PenSquare",[["path",{d:"M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",key:"1qinfi"}],["path",{d:"M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z",key:"w2jsv5"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qh=d("PenTool",[["path",{d:"m12 19 7-7 3 3-7 7-3-3z",key:"rklqx2"}],["path",{d:"m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z",key:"1et58u"}],["path",{d:"m2 2 7.586 7.586",key:"etlp93"}],["circle",{cx:"11",cy:"11",r:"2",key:"xmgehs"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ih=d("Pen",[["path",{d:"M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z",key:"5qss01"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Uh=d("Percent",[["line",{x1:"19",x2:"5",y1:"5",y2:"19",key:"1x9vlm"}],["circle",{cx:"6.5",cy:"6.5",r:"2.5",key:"4mh3h7"}],["circle",{cx:"17.5",cy:"17.5",r:"2.5",key:"1mdrzq"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nh=d("PhoneOff",[["path",{d:"M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91",key:"z86iuo"}],["line",{x1:"22",x2:"2",y1:"2",y2:"22",key:"11kh81"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wh=d("Phone",[["path",{d:"M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",key:"foiqr5"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gh=d("PieChart",[["path",{d:"M21.21 15.89A10 10 0 1 1 8 2.83",key:"k2fpak"}],["path",{d:"M22 12A10 10 0 0 0 12 2v10z",key:"1rfc4y"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zh=d("PlayCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["polygon",{points:"10 8 16 12 10 16 10 8",key:"1cimsy"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $h=d("Play",[["polygon",{points:"5 3 19 12 5 21 5 3",key:"191637"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Kh=d("Plus",[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"M12 5v14",key:"s699le"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _h=d("Printer",[["polyline",{points:"6 9 6 2 18 2 18 9",key:"1306q4"}],["path",{d:"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",key:"143wyd"}],["rect",{width:"12",height:"8",x:"6",y:"14",key:"5ipwut"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xh=d("Quote",[["path",{d:"M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z",key:"4rm80e"}],["path",{d:"M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z",key:"10za9r"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yh=d("Receipt",[["path",{d:"M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z",key:"wqdwcb"}],["path",{d:"M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8",key:"1h4pet"}],["path",{d:"M12 17V7",key:"pyj7ub"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qh=d("Redo",[["path",{d:"M21 7v6h-6",key:"3ptur4"}],["path",{d:"M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7",key:"1kgawr"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Jh=d("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const tu=d("Repeat",[["path",{d:"m17 2 4 4-4 4",key:"nntrym"}],["path",{d:"M3 11v-1a4 4 0 0 1 4-4h14",key:"84bu3i"}],["path",{d:"m7 22-4-4 4-4",key:"1wqhfi"}],["path",{d:"M21 13v1a4 4 0 0 1-4 4H3",key:"1rx37r"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const eu=d("RotateCcw",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const nu=d("Save",[["path",{d:"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",key:"1owoqh"}],["polyline",{points:"17 21 17 13 7 13 7 21",key:"1md35c"}],["polyline",{points:"7 3 7 8 15 8",key:"8nz8an"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const su=d("Search",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["path",{d:"m21 21-4.3-4.3",key:"1qie3q"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const iu=d("Send",[["path",{d:"m22 2-7 20-4-9-9-4Z",key:"1q3vgg"}],["path",{d:"M22 2 11 13",key:"nzbqef"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ru=d("Server",[["rect",{width:"20",height:"8",x:"2",y:"2",rx:"2",ry:"2",key:"ngkwjq"}],["rect",{width:"20",height:"8",x:"2",y:"14",rx:"2",ry:"2",key:"iecqi9"}],["line",{x1:"6",x2:"6.01",y1:"6",y2:"6",key:"16zg32"}],["line",{x1:"6",x2:"6.01",y1:"18",y2:"18",key:"nzw8ys"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ou=d("Settings",[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const au=d("Share2",[["circle",{cx:"18",cy:"5",r:"3",key:"gq8acd"}],["circle",{cx:"6",cy:"12",r:"3",key:"w7nqdw"}],["circle",{cx:"18",cy:"19",r:"3",key:"1xt0gg"}],["line",{x1:"8.59",x2:"15.42",y1:"13.51",y2:"17.49",key:"47mynk"}],["line",{x1:"15.41",x2:"8.59",y1:"6.51",y2:"10.49",key:"1n3mei"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const cu=d("ShieldAlert",[["path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",key:"1irkt0"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M12 16h.01",key:"1drbdi"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const lu=d("ShieldCheck",[["path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",key:"1irkt0"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const hu=d("ShieldX",[["path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",key:"1irkt0"}],["path",{d:"m14.5 9-5 5",key:"1m49dw"}],["path",{d:"m9.5 9 5 5",key:"wyx7zg"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const uu=d("Shield",[["path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",key:"1irkt0"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const du=d("ShoppingBag",[["path",{d:"M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z",key:"hou9p0"}],["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M16 10a4 4 0 0 1-8 0",key:"1ltviw"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const yu=d("ShoppingCart",[["circle",{cx:"8",cy:"21",r:"1",key:"jimo8o"}],["circle",{cx:"19",cy:"21",r:"1",key:"13723u"}],["path",{d:"M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12",key:"9zh506"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const fu=d("SlidersHorizontal",[["line",{x1:"21",x2:"14",y1:"4",y2:"4",key:"obuewd"}],["line",{x1:"10",x2:"3",y1:"4",y2:"4",key:"1q6298"}],["line",{x1:"21",x2:"12",y1:"12",y2:"12",key:"1iu8h1"}],["line",{x1:"8",x2:"3",y1:"12",y2:"12",key:"ntss68"}],["line",{x1:"21",x2:"16",y1:"20",y2:"20",key:"14d8ph"}],["line",{x1:"12",x2:"3",y1:"20",y2:"20",key:"m0wm8r"}],["line",{x1:"14",x2:"14",y1:"2",y2:"6",key:"14e1ph"}],["line",{x1:"8",x2:"8",y1:"10",y2:"14",key:"1i6ji0"}],["line",{x1:"16",x2:"16",y1:"18",y2:"22",key:"1lctlv"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pu=d("Sliders",[["line",{x1:"4",x2:"4",y1:"21",y2:"14",key:"1p332r"}],["line",{x1:"4",x2:"4",y1:"10",y2:"3",key:"gb41h5"}],["line",{x1:"12",x2:"12",y1:"21",y2:"12",key:"hf2csr"}],["line",{x1:"12",x2:"12",y1:"8",y2:"3",key:"1kfi7u"}],["line",{x1:"20",x2:"20",y1:"21",y2:"16",key:"1lhrwl"}],["line",{x1:"20",x2:"20",y1:"12",y2:"3",key:"16vvfq"}],["line",{x1:"2",x2:"6",y1:"14",y2:"14",key:"1uebub"}],["line",{x1:"10",x2:"14",y1:"8",y2:"8",key:"1yglbp"}],["line",{x1:"18",x2:"22",y1:"16",y2:"16",key:"1jxqpz"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const mu=d("Smartphone",[["rect",{width:"14",height:"20",x:"5",y:"2",rx:"2",ry:"2",key:"1yt0o3"}],["path",{d:"M12 18h.01",key:"mhygvu"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const gu=d("Smile",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M8 14s1.5 2 4 2 4-2 4-2",key:"1y1vjs"}],["line",{x1:"9",x2:"9.01",y1:"9",y2:"9",key:"yxxnd0"}],["line",{x1:"15",x2:"15.01",y1:"9",y2:"9",key:"1p4y9e"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const xu=d("Snowflake",[["line",{x1:"2",x2:"22",y1:"12",y2:"12",key:"1dnqot"}],["line",{x1:"12",x2:"12",y1:"2",y2:"22",key:"7eqyqh"}],["path",{d:"m20 16-4-4 4-4",key:"rquw4f"}],["path",{d:"m4 8 4 4-4 4",key:"12s3z9"}],["path",{d:"m16 4-4 4-4-4",key:"1tumq1"}],["path",{d:"m8 20 4-4 4 4",key:"9p200w"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ku=d("Sparkles",[["path",{d:"m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z",key:"17u4zn"}],["path",{d:"M5 3v4",key:"bklmnn"}],["path",{d:"M19 17v4",key:"iiml17"}],["path",{d:"M3 5h4",key:"nem4j1"}],["path",{d:"M17 19h4",key:"lbex7p"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const vu=d("Square",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Mu=d("Star",[["polygon",{points:"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2",key:"8f66p6"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const bu=d("Strikethrough",[["path",{d:"M16 4H9a3 3 0 0 0-2.83 4",key:"43sutm"}],["path",{d:"M14 12a4 4 0 0 1 0 8H6",key:"nlfj13"}],["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wu=d("Subscript",[["path",{d:"m4 5 8 8",key:"1eunvl"}],["path",{d:"m12 5-8 8",key:"1ah0jp"}],["path",{d:"M20 19h-4c0-1.5.44-2 1.5-2.5S20 15.33 20 14c0-.47-.17-.93-.48-1.29a2.11 2.11 0 0 0-2.62-.44c-.42.24-.74.62-.9 1.07",key:"e8ta8j"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Pu=d("Sun",[["circle",{cx:"12",cy:"12",r:"4",key:"4exip2"}],["path",{d:"M12 2v2",key:"tus03m"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"m4.93 4.93 1.41 1.41",key:"149t6j"}],["path",{d:"m17.66 17.66 1.41 1.41",key:"ptbguv"}],["path",{d:"M2 12h2",key:"1t8f8n"}],["path",{d:"M20 12h2",key:"1q8mjw"}],["path",{d:"m6.34 17.66-1.41 1.41",key:"1m8zz5"}],["path",{d:"m19.07 4.93-1.41 1.41",key:"1shlcs"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Vu=d("Superscript",[["path",{d:"m4 19 8-8",key:"hr47gm"}],["path",{d:"m12 19-8-8",key:"1dhhmo"}],["path",{d:"M20 12h-4c0-1.5.442-2 1.5-2.5S20 8.334 20 7.002c0-.472-.17-.93-.484-1.29a2.105 2.105 0 0 0-2.617-.436c-.42.239-.738.614-.899 1.06",key:"1dfcux"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Cu=d("Table",[["path",{d:"M12 3v18",key:"108xh3"}],["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}],["path",{d:"M3 9h18",key:"1pudct"}],["path",{d:"M3 15h18",key:"5xshup"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Tu=d("Tablet",[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",ry:"2",key:"76otgf"}],["line",{x1:"12",x2:"12.01",y1:"18",y2:"18",key:"1dp563"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Su=d("Tag",[["path",{d:"M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z",key:"14b2ls"}],["path",{d:"M7 7h.01",key:"7u93v4"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Au=d("Target",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Lu=d("Thermometer",[["path",{d:"M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z",key:"17jzev"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Du=d("ToggleLeft",[["rect",{width:"20",height:"12",x:"2",y:"6",rx:"6",ry:"6",key:"f2vt7d"}],["circle",{cx:"8",cy:"12",r:"2",key:"1nvbw3"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ru=d("ToggleRight",[["rect",{width:"20",height:"12",x:"2",y:"6",rx:"6",ry:"6",key:"f2vt7d"}],["circle",{cx:"16",cy:"12",r:"2",key:"4ma0v8"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ju=d("Trash2",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}],["line",{x1:"10",x2:"10",y1:"11",y2:"17",key:"1uufr5"}],["line",{x1:"14",x2:"14",y1:"11",y2:"17",key:"xtxkd"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Bu=d("TrendingDown",[["polyline",{points:"22 17 13.5 8.5 8.5 13.5 2 7",key:"1r2t7k"}],["polyline",{points:"16 17 22 17 22 11",key:"11uiuu"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Fu=d("TrendingUp",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Eu=d("Trophy",[["path",{d:"M6 9H4.5a2.5 2.5 0 0 1 0-5H6",key:"17hqa7"}],["path",{d:"M18 9h1.5a2.5 2.5 0 0 0 0-5H18",key:"lmptdp"}],["path",{d:"M4 22h16",key:"57wxv0"}],["path",{d:"M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22",key:"1nw9bq"}],["path",{d:"M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22",key:"1np0yb"}],["path",{d:"M18 2H6v7a6 6 0 0 0 12 0V2Z",key:"u46fv3"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const zu=d("Truck",[["path",{d:"M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11",key:"hs4xqm"}],["path",{d:"M14 9h4l4 4v4c0 .6-.4 1-1 1h-2",key:"11fp61"}],["circle",{cx:"7",cy:"18",r:"2",key:"19iecd"}],["path",{d:"M15 18H9",key:"1lyqi6"}],["circle",{cx:"17",cy:"18",r:"2",key:"332jqn"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ou=d("Type",[["polyline",{points:"4 7 4 4 20 4 20 7",key:"1nosan"}],["line",{x1:"9",x2:"15",y1:"20",y2:"20",key:"swin9y"}],["line",{x1:"12",x2:"12",y1:"4",y2:"20",key:"1tx1rr"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Hu=d("Underline",[["path",{d:"M6 4v6a6 6 0 0 0 12 0V4",key:"9kb039"}],["line",{x1:"4",x2:"20",y1:"20",y2:"20",key:"nun2al"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const qu=d("Undo",[["path",{d:"M3 7v6h6",key:"1v2h90"}],["path",{d:"M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13",key:"1r6uu6"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Iu=d("Unlock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 9.9-1",key:"1mm8w8"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Uu=d("Upload",[["path",{d:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",key:"ih7n3h"}],["polyline",{points:"17 8 12 3 7 8",key:"t8dd8p"}],["line",{x1:"12",x2:"12",y1:"3",y2:"15",key:"widbto"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Nu=d("UserCheck",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["polyline",{points:"16 11 18 13 22 9",key:"1pwet4"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Wu=d("UserCog",[["circle",{cx:"18",cy:"15",r:"3",key:"gjjjvw"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M10 15H6a4 4 0 0 0-4 4v2",key:"1nfge6"}],["path",{d:"m21.7 16.4-.9-.3",key:"12j9ji"}],["path",{d:"m15.2 13.9-.9-.3",key:"1fdjdi"}],["path",{d:"m16.6 18.7.3-.9",key:"heedtr"}],["path",{d:"m19.1 12.2.3-.9",key:"1af3ki"}],["path",{d:"m19.6 18.7-.4-1",key:"1x9vze"}],["path",{d:"m16.8 12.3-.4-1",key:"vqeiwj"}],["path",{d:"m14.3 16.6 1-.4",key:"1qlj63"}],["path",{d:"m20.7 13.8 1-.4",key:"1v5t8k"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Gu=d("UserPlus",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["line",{x1:"19",x2:"19",y1:"8",y2:"14",key:"1bvyxn"}],["line",{x1:"22",x2:"16",y1:"11",y2:"11",key:"1shjgl"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Zu=d("User",[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $u=d("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ku=d("VideoOff",[["path",{d:"M10.66 6H14a2 2 0 0 1 2 2v2.34l1 1L22 8v8",key:"ubwiq0"}],["path",{d:"M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2l10 10Z",key:"1l10zd"}],["line",{x1:"2",x2:"22",y1:"2",y2:"22",key:"a6p6uj"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const _u=d("Video",[["path",{d:"m22 8-6 4 6 4V8Z",key:"50v9me"}],["rect",{width:"14",height:"12",x:"2",y:"6",rx:"2",ry:"2",key:"1rqjg6"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Xu=d("Volume2",[["polygon",{points:"11 5 6 9 2 9 2 15 6 15 11 19 11 5",key:"16drj5"}],["path",{d:"M15.54 8.46a5 5 0 0 1 0 7.07",key:"ltjumu"}],["path",{d:"M19.07 4.93a10 10 0 0 1 0 14.14",key:"1kegas"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Yu=d("Wallet",[["path",{d:"M21 12V7H5a2 2 0 0 1 0-4h14v4",key:"195gfw"}],["path",{d:"M3 5v14a2 2 0 0 0 2 2h16v-5",key:"195n9w"}],["path",{d:"M18 12a2 2 0 0 0 0 4h4v-4Z",key:"vllfpd"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Qu=d("Wand2",[["path",{d:"m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z",key:"1bcowg"}],["path",{d:"m14 7 3 3",key:"1r5n42"}],["path",{d:"M5 6v4",key:"ilb8ba"}],["path",{d:"M19 14v4",key:"blhpug"}],["path",{d:"M10 2v2",key:"7u0qdc"}],["path",{d:"M7 8H3",key:"zfb6yr"}],["path",{d:"M21 16h-4",key:"1cnmox"}],["path",{d:"M11 3H9",key:"1obp7u"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ju=d("WifiOff",[["line",{x1:"2",x2:"22",y1:"2",y2:"22",key:"a6p6uj"}],["path",{d:"M8.5 16.5a5 5 0 0 1 7 0",key:"sej527"}],["path",{d:"M2 8.82a15 15 0 0 1 4.17-2.65",key:"11utq1"}],["path",{d:"M10.66 5c4.01-.36 8.14.9 11.34 3.76",key:"hxefdu"}],["path",{d:"M16.85 11.25a10 10 0 0 1 2.22 1.68",key:"q734kn"}],["path",{d:"M5 13a10 10 0 0 1 5.24-2.76",key:"piq4yl"}],["line",{x1:"12",x2:"12.01",y1:"20",y2:"20",key:"of4bc4"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const t2=d("Wifi",[["path",{d:"M5 13a10 10 0 0 1 14 0",key:"6v8j51"}],["path",{d:"M8.5 16.5a5 5 0 0 1 7 0",key:"sej527"}],["path",{d:"M2 8.82a15 15 0 0 1 20 0",key:"dnpr2z"}],["line",{x1:"12",x2:"12.01",y1:"20",y2:"20",key:"of4bc4"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const e2=d("Wind",[["path",{d:"M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2",key:"1k4u03"}],["path",{d:"M9.6 4.6A2 2 0 1 1 11 8H2",key:"b7d0fd"}],["path",{d:"M12.6 19.4A2 2 0 1 0 14 16H2",key:"1p5cb3"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const n2=d("Wrench",[["path",{d:"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",key:"cbrjhi"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const s2=d("XCircle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"m15 9-6 6",key:"1uzhvr"}],["path",{d:"m9 9 6 6",key:"z0biqf"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i2=d("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r2=d("Zap",[["polygon",{points:"13 2 3 14 12 14 11 22 21 10 12 10 13 2",key:"45s27k"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o2=d("ZoomIn",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["line",{x1:"21",x2:"16.65",y1:"21",y2:"16.65",key:"13gj7c"}],["line",{x1:"11",x2:"11",y1:"8",y2:"14",key:"1vmskp"}],["line",{x1:"8",x2:"14",y1:"11",y2:"11",key:"durymu"}]]);/**
 * @license lucide-react v0.294.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const a2=d("ZoomOut",[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["line",{x1:"21",x2:"16.65",y1:"21",y2:"16.65",key:"13gj7c"}],["line",{x1:"8",x2:"14",y1:"11",y2:"11",key:"durymu"}]]);export{dh as $,il as A,Pl as B,Yl as C,c1 as D,xh as E,v1 as F,Zl as G,N1 as H,Gl as I,eu as J,B1 as K,Q1 as L,vh as M,Ah as N,hh as O,Lh as P,Ql as Q,Jh as R,ku as S,Fu as T,$u as U,t2 as V,n2 as W,i2 as X,Ju as Y,Jl as Z,Wh as _,ml as a,_1 as a$,$l as a0,Wl as a1,r2 as a2,al as a3,fu as a4,$1 as a5,Nl as a6,Ph as a7,ju as a8,ol as a9,Ih as aA,Ul as aB,zl as aC,Xl as aD,W1 as aE,M1 as aF,ch as aG,Hh as aH,b1 as aI,Rh as aJ,Ou as aK,J1 as aL,Qu as aM,Ch as aN,Pu as aO,R1 as aP,lh as aQ,Dh as aR,pu as aS,j1 as aT,a1 as aU,t1 as aV,Uh as aW,u1 as aX,Bl as aY,d1 as aZ,Gu as a_,i1 as aa,Mu as ab,Eh as ac,s2 as ad,Il as ae,ql as af,D1 as ag,nu as ah,kl as ai,y1 as aj,_h as ak,l1 as al,ih as am,g1 as an,Zh as ao,Bu as ap,Dl as aq,r1 as ar,x1 as as,iu as at,m1 as au,f1 as av,vl as aw,Yh as ax,p1 as ay,pl as az,Kl as b,hl as b$,rl as b0,gl as b1,yl as b2,nh as b3,Cu as b4,Yu as b5,Tl as b6,jl as b7,Vh as b8,Tu as b9,Iu as bA,Ol as bB,T1 as bC,Su as bD,C1 as bE,au as bF,Lu as bG,$h as bH,dl as bI,Z1 as bJ,P1 as bK,U1 as bL,L1 as bM,A1 as bN,Cl as bO,yh as bP,zh as bQ,sh as bR,ph as bS,qu as bT,Qh as bU,a2 as bV,o2 as bW,Sh as bX,X1 as bY,Vl as bZ,K1 as b_,zu as ba,ru as bb,q1 as bc,oh as bd,w1 as be,V1 as bf,_l as bg,e1 as bh,o1 as bi,xl as bj,fl as bk,Uu as bl,gh as bm,_u as bn,Th as bo,gu as bp,Fh as bq,Ku as br,Mh as bs,bh as bt,Nh as bu,Xu as bv,tu as bw,vu as bx,Gh as by,xu as bz,Nu as c,cl as c0,ul as c1,jh as c2,Bh as c3,Hu as c4,bu as c5,wu as c6,Vu as c7,h1 as c8,I1 as c9,Sl as cA,fh as cB,wh as cC,ll as ca,rh as cb,E1 as cc,z1 as cd,O1 as ce,Xh as cf,n1 as cg,qh as ch,eh as ci,du as cj,Ru as ck,Du as cl,F1 as cm,Y1 as cn,kh as co,Oh as cp,k1 as cq,lu as cr,cu as cs,hu as ct,wl as cu,G1 as cv,Fl as cw,Hl as cx,mh as cy,S1 as cz,su as d,ah as e,s1 as f,Kh as g,ou as h,Zu as i,bl as j,El as k,Wu as l,sl as m,Au as n,Eu as o,Ml as p,H1 as q,mu as r,Al as s,Rl as t,yu as u,e2 as v,Ll as w,uh as x,th as y,uu as z};
