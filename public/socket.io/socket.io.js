/*
 The MIT license.
 @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 The MIT license.
 @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 The MIT license.
 @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 The MIT license.
 @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 The MIT license.
 @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 The MIT license.
 @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 The MIT license.
 @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 The MIT license.
 @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 The MIT license.
 @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 The MIT license.
 @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
 The MIT license.
 @copyright Copyright (c) 2010 LearnBoost <dev@learnboost.com>
*/
this.io={version:"0.6.2",setPath:function(a){window.console&&console.error&&console.error("io.setPath will be removed. Please set the variable WEB_SOCKET_SWF_LOCATION pointing to WebSocketMain.swf");this.path=/\/$/.test(a)?a:a+"/";WEB_SOCKET_SWF_LOCATION=a+"lib/vendor/web-socket-js/WebSocketMain.swf"}};if("jQuery"in this)jQuery.io=this.io;if(typeof window!="undefined")if(typeof WEB_SOCKET_SWF_LOCATION==="undefined")WEB_SOCKET_SWF_LOCATION="/socket.io/lib/vendor/web-socket-js/WebSocketMain.swf";
(function(){var a=false;io.util={ios:false,load:function(c){if(/loaded|complete/.test(document.readyState)||a)return c();"attachEvent"in window?window.attachEvent("onload",c):window.addEventListener("load",c,false)},inherit:function(c,b){for(var e in b.prototype)c.prototype[e]=b.prototype[e]},indexOf:function(c,b,e){var g=c.length;for(e=e<0?Math.max(0,g+e):e||0;e<g;e++)if(c[e]===b)return e;return-1},isArray:function(c){return Object.prototype.toString.call(c)==="[object Array]"},merge:function(c,
b){for(var e in b)if(b.hasOwnProperty(e))c[e]=b[e]}};io.util.ios=/iphone|ipad/i.test(navigator.userAgent);io.util.android=/android/i.test(navigator.userAgent);io.util.opera=/opera/i.test(navigator.userAgent);io.util.load(function(){a=true})})();
(function(){Transport=io.Transport=function(a,c){this.base=a;this.options={timeout:15E3};io.util.merge(this.options,c)};Transport.prototype.send=function(){throw Error("Missing send() implementation");};Transport.prototype.connect=function(){throw Error("Missing connect() implementation");};Transport.prototype.disconnect=function(){throw Error("Missing disconnect() implementation");};Transport.prototype._encode=function(a){var c="",b;a=io.util.isArray(a)?a:[a];for(var e=0,g=a.length;e<g;e++){if(a[e]===
null||a[e]===undefined)b="";else{b=a[e];if(Object.prototype.toString.call(b)=="[object Object]")if("JSON"in window)b="~j~"+JSON.stringify(b);else{"console"in window&&console.error&&console.error("Trying to encode as JSON, but JSON.stringify is missing.");b='{ "$error": "Invalid message" }'}else b=String(b)}b=b;c+="~m~"+b.length+"~m~"+b}return c};Transport.prototype._decode=function(a){var c=[],b,e;do{if(a.substr(0,3)!=="~m~")break;a=a.substr(3);b="";for(var g=0,l=a.length;g<l;g++){e=Number(a.substr(g,
1));if(a.substr(g,1)==e)b+=e;else{a=a.substr(b.length+3);b=Number(b);break}}c.push(a.substr(0,b));a=a.substr(b)}while(a!=="");return c};Transport.prototype._onData=function(a){this._setTimeout();if((a=this._decode(a))&&a.length)for(var c=0,b=a.length;c<b;c++)this._onMessage(a[c])};Transport.prototype._setTimeout=function(){var a=this;this._timeout&&clearTimeout(this._timeout);this._timeout=setTimeout(function(){a._onTimeout()},this.options.timeout)};Transport.prototype._onTimeout=function(){this._onDisconnect()};
Transport.prototype._onMessage=function(a){if(this.sessionid)if(a.substr(0,3)=="~h~")this._onHeartbeat(a.substr(3));else a.substr(0,3)=="~j~"?this.base._onMessage(JSON.parse(a.substr(3))):this.base._onMessage(a);else{this.sessionid=a;this._onConnect()}};Transport.prototype._onHeartbeat=function(a){this.send("~h~"+a)};Transport.prototype._onConnect=function(){this.connected=true;this.connecting=false;this.base._onConnect();this._setTimeout()};Transport.prototype._onDisconnect=function(){this.connected=
this.connecting=false;this.sessionid=null;this.base._onDisconnect()};Transport.prototype._prepareUrl=function(){return(this.base.options.secure?"https":"http")+"://"+this.base.host+":"+this.base.options.port+"/"+this.base.options.resource+"/"+this.type+(this.sessionid?"/"+this.sessionid:"/")}})();
(function(){var a=new Function,c;c="XMLHttpRequest"in window?(new XMLHttpRequest).withCredentials!=undefined:false;var b=function(g){if("XDomainRequest"in window&&g)return new XDomainRequest;if("XMLHttpRequest"in window&&(!g||c))return new XMLHttpRequest;if(!g){try{return new ActiveXObject("MSXML2.XMLHTTP")}catch(l){}try{return new ActiveXObject("Microsoft.XMLHTTP")}catch(q){}}return false},e=io.Transport.XHR=function(){io.Transport.apply(this,arguments);this._sendBuffer=[]};io.util.inherit(e,io.Transport);
e.prototype.connect=function(){this._get();return this};e.prototype._checkSend=function(){if(!this._posting&&this._sendBuffer.length){var g=this._encode(this._sendBuffer);this._sendBuffer=[];this._send(g)}};e.prototype.send=function(g){io.util.isArray(g)?this._sendBuffer.push.apply(this._sendBuffer,g):this._sendBuffer.push(g);this._checkSend();return this};e.prototype._send=function(g){var l=this;this._posting=true;this._sendXhr=this._request("send","POST");this._sendXhr.onreadystatechange=function(){var q;
if(l._sendXhr.readyState==4){l._sendXhr.onreadystatechange=a;try{q=l._sendXhr.status}catch(o){}l._posting=false;q==200?l._checkSend():l._onDisconnect()}};this._sendXhr.send("data="+encodeURIComponent(g))};e.prototype.disconnect=function(){this._onDisconnect();return this};e.prototype._onDisconnect=function(){if(this._xhr){this._xhr.onreadystatechange=a;try{this._xhr.abort()}catch(g){}this._xhr=null}if(this._sendXhr){this._sendXhr.onreadystatechange=a;try{this._sendXhr.abort()}catch(l){}this._sendXhr=
null}this._sendBuffer=[];io.Transport.prototype._onDisconnect.call(this)};e.prototype._request=function(g,l,q){var o=b(this.base._isXDomain());if(q)o.multipart=true;o.open(l||"GET",this._prepareUrl()+(g?"/"+g:""));l=="POST"&&"setRequestHeader"in o&&o.setRequestHeader("Content-type","application/x-www-form-urlencoded; charset=utf-8");return o};e.check=function(g){try{if(b(g))return true}catch(l){}return false};e.xdomainCheck=function(){return e.check(true)};e.request=b})();
(function(){var a=io.Transport.websocket=function(){io.Transport.apply(this,arguments)};io.util.inherit(a,io.Transport);a.prototype.type="websocket";a.prototype.connect=function(){var c=this;this.socket=new WebSocket(this._prepareUrl());this.socket.onmessage=function(b){c._onData(b.data)};this.socket.onclose=function(){c._onClose()};this.socket.onerror=function(b){c._onError(b)};return this};a.prototype.send=function(c){this.socket&&this.socket.send(this._encode(c));return this};a.prototype.disconnect=
function(){this.socket&&this.socket.close();return this};a.prototype._onClose=function(){this._onDisconnect();return this};a.prototype._onError=function(c){this.base.emit("error",[c])};a.prototype._prepareUrl=function(){return(this.base.options.secure?"wss":"ws")+"://"+this.base.host+":"+this.base.options.port+"/"+this.base.options.resource+"/"+this.type+(this.sessionid?"/"+this.sessionid:"")};a.check=function(){return"WebSocket"in window&&WebSocket.prototype&&WebSocket.prototype.send&&!!WebSocket.prototype.send.toString().match(/native/i)&&
typeof WebSocket!=="undefined"};a.xdomainCheck=function(){return true}})();
(function(){var a=io.Transport.flashsocket=function(){io.Transport.websocket.apply(this,arguments)};io.util.inherit(a,io.Transport.websocket);a.prototype.type="flashsocket";a.prototype.connect=function(){var c=this,b=arguments;WebSocket.__addTask(function(){io.Transport.websocket.prototype.connect.apply(c,b)});return this};a.prototype.send=function(){var c=this,b=arguments;WebSocket.__addTask(function(){io.Transport.websocket.prototype.send.apply(c,b)});return this};a.check=function(){if(typeof WebSocket==
"undefined"||!("__addTask"in WebSocket))return false;if(io.util.opera)return false;if("navigator"in window&&"plugins"in navigator&&navigator.plugins["Shockwave Flash"])return!!navigator.plugins["Shockwave Flash"].description;if("ActiveXObject"in window)try{return!!(new ActiveXObject("ShockwaveFlash.ShockwaveFlash")).GetVariable("$version")}catch(c){}return false};a.xdomainCheck=function(){return true}})();
(function(){var a=io.Transport.htmlfile=function(){io.Transport.XHR.apply(this,arguments)};io.util.inherit(a,io.Transport.XHR);a.prototype.type="htmlfile";a.prototype._get=function(){var c=this;this._open();window.attachEvent("onunload",function(){c._destroy()})};a.prototype._open=function(){this._doc=new ActiveXObject("htmlfile");this._doc.open();this._doc.write("<html></html>");this._doc.parentWindow.s=this;this._doc.close();var c=this._doc.createElement("div");this._doc.body.appendChild(c);this._iframe=
this._doc.createElement("iframe");c.appendChild(this._iframe);this._iframe.src=this._prepareUrl()+"/"+ +new Date};a.prototype._=function(c,b){this._onData(c);var e=b.getElementsByTagName("script")[0];e.parentNode.removeChild(e)};a.prototype._destroy=function(){if(this._iframe){this._iframe.src="about:blank";this._doc=null;CollectGarbage()}};a.prototype.disconnect=function(){this._destroy();return io.Transport.XHR.prototype.disconnect.call(this)};a.check=function(){if("ActiveXObject"in window)try{return new ActiveXObject("htmlfile")&&
io.Transport.XHR.check()}catch(c){}return false};a.xdomainCheck=function(){return false}})();
(function(){var a=io.Transport["xhr-multipart"]=function(){io.Transport.XHR.apply(this,arguments)};io.util.inherit(a,io.Transport.XHR);a.prototype.type="xhr-multipart";a.prototype._get=function(){var c=this;this._xhr=this._request("","GET",true);this._xhr.onreadystatechange=function(){c._xhr.readyState==4&&c._onData(c._xhr.responseText)};this._xhr.send(null)};a.check=function(){return"XMLHttpRequest"in window&&"prototype"in XMLHttpRequest&&"multipart"in XMLHttpRequest.prototype};a.xdomainCheck=function(){return true}})();
(function(){var a=new Function,c=io.Transport["xhr-polling"]=function(){io.Transport.XHR.apply(this,arguments)};io.util.inherit(c,io.Transport.XHR);c.prototype.type="xhr-polling";c.prototype.connect=function(){if(io.util.ios||io.util.android){var b=this;io.util.load(function(){setTimeout(function(){io.Transport.XHR.prototype.connect.call(b)},10)})}else io.Transport.XHR.prototype.connect.call(this)};c.prototype._get=function(){var b=this;this._xhr=this._request(+new Date,"GET");this._xhr.onreadystatechange=
function(){var e;if(b._xhr.readyState==4){b._xhr.onreadystatechange=a;try{e=b._xhr.status}catch(g){}if(e==200){b._onData(b._xhr.responseText);b._get()}else b._onDisconnect()}};this._xhr.send(null)};c.check=function(){return io.Transport.XHR.check()};c.xdomainCheck=function(){return io.Transport.XHR.xdomainCheck()}})();io.JSONP=[];
JSONPPolling=io.Transport["jsonp-polling"]=function(){io.Transport.XHR.apply(this,arguments);this._insertAt=document.getElementsByTagName("script")[0];this._index=io.JSONP.length;io.JSONP.push(this)};io.util.inherit(JSONPPolling,io.Transport["xhr-polling"]);JSONPPolling.prototype.type="jsonp-polling";
JSONPPolling.prototype._send=function(a){function c(){b();e._posting=false;e._checkSend()}function b(){e._iframe&&e._form.removeChild(e._iframe);try{o=document.createElement('<iframe name="'+e._iframeId+'">')}catch(z){o=document.createElement("iframe");o.name=e._iframeId}o.id=e._iframeId;e._form.appendChild(o);e._iframe=o}var e=this;if(!("_form"in this)){var g=document.createElement("FORM"),l=document.createElement("TEXTAREA"),q=this._iframeId="socket_io_iframe_"+this._index,o;g.style.position="absolute";
g.style.top="-1000px";g.style.left="-1000px";g.target=q;g.method="POST";g.action=this._prepareUrl()+"/"+ +new Date+"/"+this._index;l.name="data";g.appendChild(l);this._insertAt.parentNode.insertBefore(g,this._insertAt);document.body.appendChild(g);this._form=g;this._area=l}b();this._posting=true;this._area.value=a;try{this._form.submit()}catch(H){}if(this._iframe.attachEvent)o.onreadystatechange=function(){e._iframe.readyState=="complete"&&c()};else this._iframe.onload=c};
JSONPPolling.prototype._get=function(){var a=this,c=document.createElement("SCRIPT");if(this._script){this._script.parentNode.removeChild(this._script);this._script=null}c.async=true;c.src=this._prepareUrl()+"/"+ +new Date+"/"+this._index;c.onerror=function(){a._onDisconnect()};this._insertAt.parentNode.insertBefore(c,this._insertAt);this._script=c};JSONPPolling.prototype._=function(){this._onData.apply(this,arguments);this._get();return this};JSONPPolling.check=function(){return true};
JSONPPolling.xdomainCheck=function(){return true};
(function(){var a=io.Socket=function(c,b){this.host=c||document.domain;this.options={secure:false,document:document,port:document.location.port||80,resource:"socket.io",transports:["websocket","flashsocket","htmlfile","xhr-multipart","xhr-polling","jsonp-polling"],transportOptions:{"xhr-polling":{timeout:25E3},"jsonp-polling":{timeout:25E3}},connectTimeout:5E3,tryTransportsOnConnectTimeout:true,rememberTransport:true};io.util.merge(this.options,b);this.connecting=this.connected=false;this._events=
{};this.transport=this.getTransport();!this.transport&&"console"in window&&console.error("No transport available")};a.prototype.getTransport=function(c){var b=c||this.options.transports;if(this.options.rememberTransport&&!c)if(c=this.options.document.cookie.match("(?:^|;)\\s*socketio=([^;]*)")){this._rememberedTransport=true;b=[decodeURIComponent(c[1])]}c=0;for(var e;e=b[c];c++)if(io.Transport[e]&&io.Transport[e].check()&&(!this._isXDomain()||io.Transport[e].xdomainCheck()))return new io.Transport[e](this,
this.options.transportOptions[e]||{});return null};a.prototype.connect=function(){if(this.transport&&!this.connected){this.connecting&&this.disconnect();this.connecting=true;this.emit("connecting",[this.transport.type]);this.transport.connect();if(this.options.connectTimeout){var c=this;this.connectTimeoutTimer=setTimeout(function(){if(!c.connected){c.disconnect();if(c.options.tryTransportsOnConnectTimeout&&!c._rememberedTransport){if(!c._remainingTransports)c._remainingTransports=c.options.transports.slice(0);
for(var b=c._remainingTransports;b.length>0&&b.splice(0,1)[0]!=c.transport.type;);if(b.length){c.transport=c.getTransport(b);c.connect()}}if(!c._remainingTransports||c._remainingTransports.length==0)c.emit("connect_failed")}c._remainingTransports&&c._remainingTransports.length==0&&delete c._remainingTransports},this.options.connectTimeout)}}return this};a.prototype.send=function(c){if(!this.transport||!this.transport.connected)return this._queue(c);this.transport.send(c);return this};a.prototype.disconnect=
function(){this.connectTimeoutTimer&&clearTimeout(this.connectTimeoutTimer);this.transport.disconnect();return this};a.prototype.on=function(c,b){c in this._events||(this._events[c]=[]);this._events[c].push(b);return this};a.prototype.emit=function(c,b){if(c in this._events)for(var e=this._events[c].concat(),g=0,l=e.length;g<l;g++)e[g].apply(this,b===undefined?[]:b);return this};a.prototype.removeEvent=function(c,b){if(c in this._events)for(var e=0,g=this._events[c].length;e<g;e++)this._events[c][e]==
b&&this._events[c].splice(e,1);return this};a.prototype._queue=function(c){if(!("_queueStack"in this))this._queueStack=[];this._queueStack.push(c);return this};a.prototype._doQueue=function(){if(!("_queueStack"in this)||!this._queueStack.length)return this;this.transport.send(this._queueStack);this._queueStack=[];return this};a.prototype._isXDomain=function(){return this.host!==document.domain};a.prototype._onConnect=function(){this.connected=true;this.connecting=false;this._doQueue();if(this.options.rememberTransport)this.options.document.cookie=
"socketio="+encodeURIComponent(this.transport.type);this.emit("connect")};a.prototype._onMessage=function(c){this.emit("message",[c])};a.prototype._onDisconnect=function(){var c=this.connected;this.connecting=this.connected=false;this._queueStack=[];c&&this.emit("disconnect")};a.prototype.fire=a.prototype.emit;a.prototype.addListener=a.prototype.addEvent=a.prototype.addEventListener=a.prototype.on})();
var swfobject=function(){function a(){if(!E){try{var d=m.getElementsByTagName("body")[0].appendChild(m.createElement("span"));d.parentNode.removeChild(d)}catch(f){return}E=true;d=K.length;for(var h=0;h<d;h++)K[h]()}}function c(d){if(E)d();else K[K.length]=d}function b(d){if(typeof u.addEventListener!=r)u.addEventListener("load",d,false);else if(typeof m.addEventListener!=r)m.addEventListener("load",d,false);else if(typeof u.attachEvent!=r)ba(u,"onload",d);else if(typeof u.onload=="function"){var f=
u.onload;u.onload=function(){f();d()}}else u.onload=d}function e(){var d=m.getElementsByTagName("body")[0],f=m.createElement(w);f.setAttribute("type",L);var h=d.appendChild(f);if(h){var i=0;(function(){if(typeof h.GetVariable!=r){var j=h.GetVariable("$version");if(j){j=j.split(" ")[1].split(",");k.pv=[parseInt(j[0],10),parseInt(j[1],10),parseInt(j[2],10)]}}else if(i<10){i++;setTimeout(arguments.callee,10);return}d.removeChild(f);h=null;g()})()}else g()}function g(){var d=A.length;if(d>0)for(var f=
0;f<d;f++){var h=A[f].id,i=A[f].callbackFn,j={success:false,id:h};if(k.pv[0]>0){var p=v(h);if(p)if(M(A[f].swfVersion)&&!(k.wk&&k.wk<312)){F(h,true);if(i){j.success=true;j.ref=l(h);i(j)}}else if(A[f].expressInstall&&q()){j={};j.data=A[f].expressInstall;j.width=p.getAttribute("width")||"0";j.height=p.getAttribute("height")||"0";if(p.getAttribute("class"))j.styleclass=p.getAttribute("class");if(p.getAttribute("align"))j.align=p.getAttribute("align");var n={};p=p.getElementsByTagName("param");for(var s=
p.length,t=0;t<s;t++)if(p[t].getAttribute("name").toLowerCase()!="movie")n[p[t].getAttribute("name")]=p[t].getAttribute("value");o(j,n,h,i)}else{H(p);i&&i(j)}}else{F(h,true);if(i){if((h=l(h))&&typeof h.SetVariable!=r){j.success=true;j.ref=h}i(j)}}}}function l(d){var f=null;if((d=v(d))&&d.nodeName=="OBJECT")if(typeof d.SetVariable!=r)f=d;else if(d=d.getElementsByTagName(w)[0])f=d;return f}function q(){return!N&&M("6.0.65")&&(k.win||k.mac)&&!(k.wk&&k.wk<312)}function o(d,f,h,i){N=true;T=i||null;V={success:false,
id:h};var j=v(h);if(j){if(j.nodeName=="OBJECT"){I=z(j);O=null}else{I=j;O=h}d.id=W;if(typeof d.width==r||!/%$/.test(d.width)&&parseInt(d.width,10)<310)d.width="310";if(typeof d.height==r||!/%$/.test(d.height)&&parseInt(d.height,10)<137)d.height="137";m.title=m.title.slice(0,47)+" - Flash Player Installation";i=k.ie&&k.win?"ActiveX":"PlugIn";i="MMredirectURL="+u.location.toString().replace(/&/g,"%26")+"&MMplayerType="+i+"&MMdoctitle="+m.title;if(typeof f.flashvars!=r)f.flashvars+="&"+i;else f.flashvars=
i;if(k.ie&&k.win&&j.readyState!=4){i=m.createElement("div");h+="SWFObjectNew";i.setAttribute("id",h);j.parentNode.insertBefore(i,j);j.style.display="none";(function(){j.readyState==4?j.parentNode.removeChild(j):setTimeout(arguments.callee,10)})()}B(d,f,h)}}function H(d){if(k.ie&&k.win&&d.readyState!=4){var f=m.createElement("div");d.parentNode.insertBefore(f,d);f.parentNode.replaceChild(z(d),f);d.style.display="none";(function(){d.readyState==4?d.parentNode.removeChild(d):setTimeout(arguments.callee,
10)})()}else d.parentNode.replaceChild(z(d),d)}function z(d){var f=m.createElement("div");if(k.win&&k.ie)f.innerHTML=d.innerHTML;else if(d=d.getElementsByTagName(w)[0])if(d=d.childNodes)for(var h=d.length,i=0;i<h;i++)!(d[i].nodeType==1&&d[i].nodeName=="PARAM")&&d[i].nodeType!=8&&f.appendChild(d[i].cloneNode(true));return f}function B(d,f,h){var i,j=v(h);if(k.wk&&k.wk<312)return i;if(j){if(typeof d.id==r)d.id=h;if(k.ie&&k.win){var p="",n;for(n in d)if(d[n]!=Object.prototype[n])if(n.toLowerCase()==
"data")f.movie=d[n];else if(n.toLowerCase()=="styleclass")p+=' class="'+d[n]+'"';else if(n.toLowerCase()!="classid")p+=" "+n+'="'+d[n]+'"';n="";for(var s in f)if(f[s]!=Object.prototype[s])n+='<param name="'+s+'" value="'+f[s]+'" />';j.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+p+">"+n+"</object>";P[P.length]=d.id;i=v(d.id)}else{s=m.createElement(w);s.setAttribute("type",L);for(var t in d)if(d[t]!=Object.prototype[t])if(t.toLowerCase()=="styleclass")s.setAttribute("class",
d[t]);else t.toLowerCase()!="classid"&&s.setAttribute(t,d[t]);for(p in f)if(f[p]!=Object.prototype[p]&&p.toLowerCase()!="movie"){d=s;n=p;t=f[p];h=m.createElement("param");h.setAttribute("name",n);h.setAttribute("value",t);d.appendChild(h)}j.parentNode.replaceChild(s,j);i=s}}return i}function X(d){var f=v(d);if(f&&f.nodeName=="OBJECT")if(k.ie&&k.win){f.style.display="none";(function(){if(f.readyState==4){var h=v(d);if(h){for(var i in h)if(typeof h[i]=="function")h[i]=null;h.parentNode.removeChild(h)}}else setTimeout(arguments.callee,
10)})()}else f.parentNode.removeChild(f)}function v(d){var f=null;try{f=m.getElementById(d)}catch(h){}return f}function ba(d,f,h){d.attachEvent(f,h);G[G.length]=[d,f,h]}function M(d){var f=k.pv;d=d.split(".");d[0]=parseInt(d[0],10);d[1]=parseInt(d[1],10)||0;d[2]=parseInt(d[2],10)||0;return f[0]>d[0]||f[0]==d[0]&&f[1]>d[1]||f[0]==d[0]&&f[1]==d[1]&&f[2]>=d[2]?true:false}function Y(d,f,h,i){if(!(k.ie&&k.mac)){var j=m.getElementsByTagName("head")[0];if(j){h=h&&typeof h=="string"?h:"screen";if(i)U=x=null;
if(!x||U!=h){i=m.createElement("style");i.setAttribute("type","text/css");i.setAttribute("media",h);x=j.appendChild(i);if(k.ie&&k.win&&typeof m.styleSheets!=r&&m.styleSheets.length>0)x=m.styleSheets[m.styleSheets.length-1];U=h}if(k.ie&&k.win)x&&typeof x.addRule==w&&x.addRule(d,f);else x&&typeof m.createTextNode!=r&&x.appendChild(m.createTextNode(d+" {"+f+"}"))}}}function F(d,f){if(Z){var h=f?"visible":"hidden";if(E&&v(d))v(d).style.visibility=h;else Y("#"+d,"visibility:"+h)}}function $(d){return/[\\\"<>\.;]/.exec(d)!=
null&&typeof encodeURIComponent!=r?encodeURIComponent(d):d}var r="undefined",w="object",L="application/x-shockwave-flash",W="SWFObjectExprInst",u=window,m=document,C=navigator,aa=false,K=[function(){aa?e():g()}],A=[],P=[],G=[],I,O,T,V,E=false,N=false,x,U,Z=true,k=function(){var d=typeof m.getElementById!=r&&typeof m.getElementsByTagName!=r&&typeof m.createElement!=r,f=C.userAgent.toLowerCase(),h=C.platform.toLowerCase(),i=h?/win/.test(h):/win/.test(f);h=h?/mac/.test(h):/mac/.test(f);f=/webkit/.test(f)?
parseFloat(f.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):false;var j=!+"\u000b1",p=[0,0,0],n=null;if(typeof C.plugins!=r&&typeof C.plugins["Shockwave Flash"]==w){if((n=C.plugins["Shockwave Flash"].description)&&!(typeof C.mimeTypes!=r&&C.mimeTypes[L]&&!C.mimeTypes[L].enabledPlugin)){aa=true;j=false;n=n.replace(/^.*\s+(\S+\s+\S+$)/,"$1");p[0]=parseInt(n.replace(/^(.*)\..*$/,"$1"),10);p[1]=parseInt(n.replace(/^.*\.(.*)\s.*$/,"$1"),10);p[2]=/[a-zA-Z]/.test(n)?parseInt(n.replace(/^.*[a-zA-Z]+(.*)$/,
"$1"),10):0}}else if(typeof u.ActiveXObject!=r)try{var s=new ActiveXObject("ShockwaveFlash.ShockwaveFlash");if(s)if(n=s.GetVariable("$version")){j=true;n=n.split(" ")[1].split(",");p=[parseInt(n[0],10),parseInt(n[1],10),parseInt(n[2],10)]}}catch(t){}return{w3:d,pv:p,wk:f,ie:j,win:i,mac:h}}();(function(){if(k.w3){if(typeof m.readyState!=r&&m.readyState=="complete"||typeof m.readyState==r&&(m.getElementsByTagName("body")[0]||m.body))a();if(!E){typeof m.addEventListener!=r&&m.addEventListener("DOMContentLoaded",
a,false);if(k.ie&&k.win){m.attachEvent("onreadystatechange",function(){if(m.readyState=="complete"){m.detachEvent("onreadystatechange",arguments.callee);a()}});u==top&&function(){if(!E){try{m.documentElement.doScroll("left")}catch(d){setTimeout(arguments.callee,0);return}a()}}()}k.wk&&function(){E||(/loaded|complete/.test(m.readyState)?a():setTimeout(arguments.callee,0))}();b(a)}}})();(function(){k.ie&&k.win&&window.attachEvent("onunload",function(){for(var d=G.length,f=0;f<d;f++)G[f][0].detachEvent(G[f][1],
G[f][2]);d=P.length;for(f=0;f<d;f++)X(P[f]);for(var h in k)k[h]=null;k=null;for(var i in swfobject)swfobject[i]=null;swfobject=null})})();return{registerObject:function(d,f,h,i){if(k.w3&&d&&f){var j={};j.id=d;j.swfVersion=f;j.expressInstall=h;j.callbackFn=i;A[A.length]=j;F(d,false)}else i&&i({success:false,id:d})},getObjectById:function(d){if(k.w3)return l(d)},embedSWF:function(d,f,h,i,j,p,n,s,t,J){var Q={success:false,id:f};if(k.w3&&!(k.wk&&k.wk<312)&&d&&f&&h&&i&&j){F(f,false);c(function(){h+="";
i+="";var D={};if(t&&typeof t===w)for(var y in t)D[y]=t[y];D.data=d;D.width=h;D.height=i;y={};if(s&&typeof s===w)for(var R in s)y[R]=s[R];if(n&&typeof n===w)for(var S in n)if(typeof y.flashvars!=r)y.flashvars+="&"+S+"="+n[S];else y.flashvars=S+"="+n[S];if(M(j)){R=B(D,y,f);D.id==f&&F(f,true);Q.success=true;Q.ref=R}else if(p&&q()){D.data=p;o(D,y,f,J);return}else F(f,true);J&&J(Q)})}else J&&J(Q)},switchOffAutoHideShow:function(){Z=false},ua:k,getFlashPlayerVersion:function(){return{major:k.pv[0],minor:k.pv[1],
release:k.pv[2]}},hasFlashPlayerVersion:M,createSWF:function(d,f,h){if(k.w3)return B(d,f,h)},showExpressInstall:function(d,f,h,i){k.w3&&q()&&o(d,f,h,i)},removeSWF:function(d){k.w3&&X(d)},createCSS:function(d,f,h,i){k.w3&&Y(d,f,h,i)},addDomLoadEvent:c,addLoadEvent:b,getQueryParamValue:function(d){var f=m.location.search||m.location.hash;if(f){if(/\?/.test(f))f=f.split("?")[1];if(d==null)return $(f);f=f.split("&");for(var h=0;h<f.length;h++)if(f[h].substring(0,f[h].indexOf("="))==d)return $(f[h].substring(f[h].indexOf("=")+
1))}return""},expressInstallCallback:function(){if(N){var d=v(W);if(d&&I){d.parentNode.replaceChild(I,d);if(O){F(O,true);if(k.ie&&k.win)I.style.display="block"}T&&T(V)}N=false}}}}();function FABridge(a,c){this.target=a;this.remoteTypeCache={};this.remoteInstanceCache={};this.remoteFunctionCache={};this.localFunctionCache={};this.bridgeID=FABridge.nextBridgeID++;this.name=c;this.nextLocalFuncID=0;FABridge.instances[this.name]=this;FABridge.idMap[this.bridgeID]=this;return this}
FABridge.TYPE_ASINSTANCE=1;FABridge.TYPE_ASFUNCTION=2;FABridge.TYPE_JSFUNCTION=3;FABridge.TYPE_ANONYMOUS=4;FABridge.initCallbacks={};FABridge.userTypes={};FABridge.addToUserTypes=function(){for(var a=0;a<arguments.length;a++)FABridge.userTypes[arguments[a]]={typeName:arguments[a],enriched:false}};FABridge.argsToArray=function(a){for(var c=[],b=0;b<a.length;b++)c[b]=a[b];return c};function instanceFactory(a){this.fb_instance_id=a;return this}
function FABridge__invokeJSFunction(a){var c=a[0];a=a.concat();a.shift();return FABridge.extractBridgeFromID(c).invokeLocalFunction(c,a)}FABridge.addInitializationCallback=function(a,c){var b=FABridge.instances[a];if(b!=undefined)c.call(b);else{b=FABridge.initCallbacks[a];if(b==null)FABridge.initCallbacks[a]=b=[];b.push(c)}};
function FABridge__bridgeInitialized(a){var c=document.getElementsByTagName("object"),b=c.length,e=[];if(b>0)for(var g=0;g<b;g++)if(typeof c[g].SetVariable!="undefined")e[e.length]=c[g];b=document.getElementsByTagName("embed");g=b.length;c=[];if(g>0)for(var l=0;l<g;l++)if(typeof b[l].SetVariable!="undefined")c[c.length]=b[l];l=e.length;b=c.length;g="bridgeName="+a;if(l==1&&!b||l==1&&b==1)FABridge.attachBridge(e[0],a);else if(b==1&&!l)FABridge.attachBridge(c[0],a);else{var q=false;if(l>1)for(var o=
0;o<l;o++){for(var H=e[o].childNodes,z=0;z<H.length;z++){var B=H[z];if(B.nodeType==1&&B.tagName.toLowerCase()=="param"&&B.name.toLowerCase()=="flashvars"&&B.value.indexOf(g)>=0){FABridge.attachBridge(e[o],a);q=true;break}}if(q)break}if(!q&&b>1)for(e=0;e<b;e++)if(c[e].attributes.getNamedItem("flashVars").nodeValue.indexOf(g)>=0){FABridge.attachBridge(c[e],a);break}}return true}FABridge.nextBridgeID=0;FABridge.instances={};FABridge.idMap={};FABridge.refCount=0;
FABridge.extractBridgeFromID=function(a){return FABridge.idMap[a>>16]};FABridge.attachBridge=function(a,c){var b=new FABridge(a,c);FABridge[c]=b;var e=FABridge.initCallbacks[c];if(e!=null){for(var g=0;g<e.length;g++)e[g].call(b);delete FABridge.initCallbacks[c]}};FABridge.blockedMethods={toString:true,get:true,set:true,call:true};
FABridge.prototype={root:function(){return this.deserialize(this.target.getRoot())},releaseASObjects:function(){return this.target.releaseASObjects()},releaseNamedASObject:function(a){return typeof a!="object"?false:this.target.releaseNamedASObject(a.fb_instance_id)},create:function(a){return this.deserialize(this.target.create(a))},makeID:function(a){return(this.bridgeID<<16)+a},getPropertyFromAS:function(a,c){if(FABridge.refCount>0)throw Error("You are trying to call recursively into the Flash Player which is not allowed. In most cases the JavaScript setTimeout function, can be used as a workaround.");
else{FABridge.refCount++;retVal=this.target.getPropFromAS(a,c);retVal=this.handleError(retVal);FABridge.refCount--;return retVal}},setPropertyInAS:function(a,c,b){if(FABridge.refCount>0)throw Error("You are trying to call recursively into the Flash Player which is not allowed. In most cases the JavaScript setTimeout function, can be used as a workaround.");else{FABridge.refCount++;retVal=this.target.setPropInAS(a,c,this.serialize(b));retVal=this.handleError(retVal);FABridge.refCount--;return retVal}},
callASFunction:function(a,c){if(FABridge.refCount>0)throw Error("You are trying to call recursively into the Flash Player which is not allowed. In most cases the JavaScript setTimeout function, can be used as a workaround.");else{FABridge.refCount++;retVal=this.target.invokeASFunction(a,this.serialize(c));retVal=this.handleError(retVal);FABridge.refCount--;return retVal}},callASMethod:function(a,c,b){if(FABridge.refCount>0)throw Error("You are trying to call recursively into the Flash Player which is not allowed. In most cases the JavaScript setTimeout function, can be used as a workaround.");
else{FABridge.refCount++;b=this.serialize(b);retVal=this.target.invokeASMethod(a,c,b);retVal=this.handleError(retVal);FABridge.refCount--;return retVal}},invokeLocalFunction:function(a,c){var b,e=this.localFunctionCache[a];if(e!=undefined)b=this.serialize(e.apply(null,this.deserialize(c)));return b},getTypeFromName:function(a){return this.remoteTypeCache[a]},createProxy:function(a,c){var b=this.getTypeFromName(c);instanceFactory.prototype=b;b=new instanceFactory(a);return this.remoteInstanceCache[a]=
b},getProxy:function(a){return this.remoteInstanceCache[a]},addTypeDataToCache:function(a){for(var c=new ASProxy(this,a.name),b=a.accessors,e=0;e<b.length;e++)this.addPropertyToType(c,b[e]);a=a.methods;for(e=0;e<a.length;e++)FABridge.blockedMethods[a[e]]==undefined&&this.addMethodToType(c,a[e]);return this.remoteTypeCache[c.typeName]=c},addPropertyToType:function(a,c){var b=c.charAt(0),e;if(b>="a"&&b<="z"){e="get"+b.toUpperCase()+c.substr(1);b="set"+b.toUpperCase()+c.substr(1)}else{e="get"+c;b="set"+
c}a[b]=function(g){this.bridge.setPropertyInAS(this.fb_instance_id,c,g)};a[e]=function(){return this.bridge.deserialize(this.bridge.getPropertyFromAS(this.fb_instance_id,c))}},addMethodToType:function(a,c){a[c]=function(){return this.bridge.deserialize(this.bridge.callASMethod(this.fb_instance_id,c,FABridge.argsToArray(arguments)))}},getFunctionProxy:function(a){var c=this;if(this.remoteFunctionCache[a]==null)this.remoteFunctionCache[a]=function(){c.callASFunction(a,FABridge.argsToArray(arguments))};
return this.remoteFunctionCache[a]},getFunctionID:function(a){if(a.__bridge_id__==undefined){a.__bridge_id__=this.makeID(this.nextLocalFuncID++);this.localFunctionCache[a.__bridge_id__]=a}return a.__bridge_id__},serialize:function(a){var c={},b=typeof a;if(b=="number"||b=="string"||b=="boolean"||b==null||b==undefined)c=a;else if(a instanceof Array){c=[];for(b=0;b<a.length;b++)c[b]=this.serialize(a[b])}else if(b=="function"){c.type=FABridge.TYPE_JSFUNCTION;c.value=this.getFunctionID(a)}else if(a instanceof
ASProxy){c.type=FABridge.TYPE_ASINSTANCE;c.value=a.fb_instance_id}else{c.type=FABridge.TYPE_ANONYMOUS;c.value=a}return c},deserialize:function(a){var c,b=typeof a;if(b=="number"||b=="string"||b=="boolean"||a==null||a==undefined)c=this.handleError(a);else if(a instanceof Array){c=[];for(b=0;b<a.length;b++)c[b]=this.deserialize(a[b])}else if(b=="object"){for(b=0;b<a.newTypes.length;b++)this.addTypeDataToCache(a.newTypes[b]);for(var e in a.newRefs)this.createProxy(e,a.newRefs[e]);if(a.type==FABridge.TYPE_PRIMITIVE)c=
a.value;else if(a.type==FABridge.TYPE_ASFUNCTION)c=this.getFunctionProxy(a.value);else if(a.type==FABridge.TYPE_ASINSTANCE)c=this.getProxy(a.value);else if(a.type==FABridge.TYPE_ANONYMOUS)c=a.value}return c},addRef:function(a){this.target.incRef(a.fb_instance_id)},release:function(a){this.target.releaseRef(a.fb_instance_id)},handleError:function(a){if(typeof a=="string"&&a.indexOf("__FLASHERROR")==0){a=a.split("||");FABridge.refCount>0&&FABridge.refCount--;throw Error(a[1]);}return a}};
ASProxy=function(a,c){this.bridge=a;this.typeName=c;return this};ASProxy.prototype={get:function(a){return this.bridge.deserialize(this.bridge.getPropertyFromAS(this.fb_instance_id,a))},set:function(a,c){this.bridge.setPropertyInAS(this.fb_instance_id,a,c)},call:function(a,c){this.bridge.callASMethod(this.fb_instance_id,a,c)},addRef:function(){this.bridge.addRef(this)},release:function(){this.bridge.release(this)}};
(function(){function a(){}if(!window.WebSocket){var c=window.console;if(!c||!c.log||!c.error)c={log:function(){},error:function(){}};if(swfobject.hasFlashPlayerVersion("9.0.0")){location.protocol=="file:"&&c.error("WARNING: web-socket-js doesn't work in file:///... URL unless you set Flash Security Settings properly. Open the page via Web server i.e. http://...");WebSocket=function(b,e,g,l,q){var o=this;o.readyState=WebSocket.CONNECTING;o.bufferedAmount=0;setTimeout(function(){WebSocket.__addTask(function(){o.__createFlash(b,
e,g,l,q)})},0)};WebSocket.prototype.__createFlash=function(b,e,g,l,q){var o=this;o.__flash=WebSocket.__flash.create(b,e,g||null,l||0,q||null);o.__flash.addEventListener("event",function(){setTimeout(function(){o.__handleEvents()},0)})};WebSocket.prototype.send=function(b){if(!this.__flash||this.readyState==WebSocket.CONNECTING)throw"INVALID_STATE_ERR: Web Socket connection has not been established";b=this.__flash.send(encodeURIComponent(b));if(b<0)return true;else{this.bufferedAmount+=b;return false}};
WebSocket.prototype.close=function(){if(this.__flash)if(!(this.readyState==WebSocket.CLOSED||this.readyState==WebSocket.CLOSING)){this.__flash.close();this.readyState=WebSocket.CLOSED;this.__timer&&clearInterval(this.__timer);this.onclose&&setTimeout(this.onclose,0)}};WebSocket.prototype.addEventListener=function(b,e){if(!("__events"in this))this.__events={};if(!(b in this.__events)){this.__events[b]=[];if("function"==typeof this["on"+b]){this.__events[b].defaultHandler=this["on"+b];this["on"+b]=
this.__createEventHandler(this,b)}}this.__events[b].push(e)};WebSocket.prototype.removeEventListener=function(b,e){if(!("__events"in this))this.__events={};if(b in this.__events)for(var g=this.__events.length;g>-1;--g)if(e===this.__events[b][g]){this.__events[b].splice(g,1);break}};WebSocket.prototype.dispatchEvent=function(b){if(!("__events"in this))throw"UNSPECIFIED_EVENT_TYPE_ERR";if(!(b.type in this.__events))throw"UNSPECIFIED_EVENT_TYPE_ERR";for(var e=0,g=this.__events[b.type].length;e<g;++e){this.__events[b.type][e](b);
if(b.cancelBubble)break}false!==b.returnValue&&"function"==typeof this.__events[b.type].defaultHandler&&this.__events[b.type].defaultHandler(b)};WebSocket.prototype.__handleEvents=function(){for(var b=this.__flash.receiveEvents(),e=0;e<b.length;e++)try{var g=b[e];if("readyState"in g)this.readyState=g.readyState;if(g.type=="open"){this.__timer&&clearInterval(this.__timer);if(window.opera)this.__timer=setInterval(function(){this.__handleEvents()},500);this.onopen&&this.onopen()}else if(g.type=="close"){this.__timer&&
clearInterval(this.__timer);this.onclose&&this.onclose()}else if(g.type=="message"){if(this.onmessage){var l=decodeURIComponent(g.data),q;if(window.MessageEvent&&!window.opera){q=document.createEvent("MessageEvent");q.initMessageEvent("message",false,false,l,null,null,window,null)}else q={data:l};this.onmessage(q)}}else if(g.type=="error"){this.__timer&&clearInterval(this.__timer);this.onerror&&this.onerror()}else throw"unknown event type: "+g.type;}catch(o){c.error(o.toString())}};WebSocket.prototype.__createEventHandler=
function(b,e){return function(g){var l=new a;l.initEvent(e,true,true);l.target=l.currentTarget=b;for(var q in g)l[q]=g[q];b.dispatchEvent(l,arguments)}};a.prototype.cancelable=true;a.prototype.cancelBubble=false;a.prototype.preventDefault=function(){if(this.cancelable)this.returnValue=false};a.prototype.stopPropagation=function(){this.cancelBubble=true};a.prototype.initEvent=function(b,e,g){this.type=b;this.cancelable=g;this.timeStamp=new Date};WebSocket.CONNECTING=0;WebSocket.OPEN=1;WebSocket.CLOSING=
2;WebSocket.CLOSED=3;WebSocket.__tasks=[];WebSocket.loadFlashPolicyFile=function(b){WebSocket.__addTask(function(){WebSocket.__flash.loadManualPolicyFile(b)})};WebSocket.__initialize=function(){if(WebSocket.__swfLocation)window.WEB_SOCKET_SWF_LOCATION=WebSocket.__swfLocation;if(window.WEB_SOCKET_SWF_LOCATION){var b=document.createElement("div");b.id="webSocketContainer";b.style.position="absolute";if(WebSocket.__isFlashLite()){b.style.left="0px";b.style.top="0px"}else{b.style.left="-100px";b.style.top=
"-100px"}var e=document.createElement("div");e.id="webSocketFlash";b.appendChild(e);document.body.appendChild(b);swfobject.embedSWF(WEB_SOCKET_SWF_LOCATION,"webSocketFlash","1","1","9.0.0",null,{bridgeName:"webSocket"},{hasPriority:true,allowScriptAccess:"always"},null,function(g){g.success||c.error("[WebSocket] swfobject.embedSWF failed")});FABridge.addInitializationCallback("webSocket",function(){try{WebSocket.__flash=FABridge.webSocket.root();WebSocket.__flash.setCallerUrl(location.href);WebSocket.__flash.setDebug(!!window.WEB_SOCKET_DEBUG);
for(var g=0;g<WebSocket.__tasks.length;++g)WebSocket.__tasks[g]();WebSocket.__tasks=[]}catch(l){c.error("[WebSocket] "+l.toString())}})}else c.error("[WebSocket] set WEB_SOCKET_SWF_LOCATION to location of WebSocketMain.swf")};WebSocket.__addTask=function(b){WebSocket.__flash?b():WebSocket.__tasks.push(b)};WebSocket.__isFlashLite=function(){if(!window.navigator||!window.navigator.mimeTypes)return false;var b=window.navigator.mimeTypes["application/x-shockwave-flash"];if(!b||!b.enabledPlugin||!b.enabledPlugin.filename)return false;
return b.enabledPlugin.filename.match(/flashlite/i)?true:false};window.webSocketLog=function(b){c.log(decodeURIComponent(b))};window.webSocketError=function(b){c.error(decodeURIComponent(b))};window.WEB_SOCKET_DISABLE_AUTO_INITIALIZATION||(window.addEventListener?window.addEventListener("load",WebSocket.__initialize,false):window.attachEvent("onload",WebSocket.__initialize))}else c.error("Flash Player is not installed.")}})();
