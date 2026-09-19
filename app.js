(function(){
var SVC="49535343-fe7d-4ae5-8fa9-9fafd205e455",TX="49535343-8841-43f4-a8d4-ecbe34729bb3",RX="49535343-1e4d-4bd9-ba61-23c647249616";
var MODE=[{id:1,name:"Im lặng"},{id:2,name:"Cân bằng"},{id:3,name:"Cực lạnh"}];
var LIGHT=[{id:1,name:"Ánh sáng chảy",color:"multi",speed:1},{id:2,name:"Nhịp thở",color:"one",speed:1},{id:3,name:"Đuổi theo",color:"one",speed:1},{id:4,name:"Ánh sáng mềm",color:"one",speed:1},{id:5,name:"Sáng liên tục",color:"one",speed:0},{id:6,name:"Ánh sao",color:"multi",speed:1},{id:7,name:"Linh động",color:"multi",speed:1}];
var st={ok:false,dev:null,w:null,on:false,mode:3,fx:1,rage:0,pct:100,low:false,timer:null,timerEnd:0,fw:"V212",busy:false,holdUntil:0,runAcc:0,runAt:0,poll:null,ledSpd:3,ledHex:"#8000FF",ledOn:true,ledLock:false,q:[],qRun:false,lastW:null,lastRpm:null,lastHot:null,lastCold:null,zeroN:0,lastA5:0,_pi:0};
function $(id){return document.getElementById(id)}
function setTxt(id,t){var e=$(id);if(e)e.textContent=t}
function setCls(id,c){var e=$(id);if(e)e.className=c}
function toast(m){var t=$("toast");if(!t)return;t.textContent=m;t.style.display="block";clearTimeout(toast.t);toast.t=setTimeout(function(){t.style.display="none"},2200)}
function sum8(a){var s=0;for(var i=0;i<a.length;i++)s=(s+a[i])&255;return s}
function frame(cmd,data){data=data||[];var p=[0x20,cmd,data.length].concat(data);p.push(sum8(p));return p}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)})}
function modeName(id){var m=MODE.filter(function(x){return x.id===id})[0];return m?m.name:"Cân bằng"}
function lightOf(id){return LIGHT.filter(function(x){return x.id===id})[0]||{id:id,name:"Mode "+id,color:"one",speed:1}}
function lightName(id){return lightOf(id).name}
function pad(n){return (n<10?"0":"")+n}
function fmtRun(ms){var s=Math.floor(ms/1000),h=Math.floor(s/3600);s%=3600;var m=Math.floor(s/60);s%=60;return pad(h)+":"+pad(m)+":"+pad(s)}
function ledSp(){var sp=+st.ledSpd||3;return Math.max(1,Math.min(5,sp))}
function enqueue(fn){return new Promise(function(resolve,reject){st.q.push({fn:fn,resolve:resolve,reject:reject});drainQ()})}
async function drainQ(){if(st.qRun||!st.q.length)return;st.qRun=true;while(st.q.length){var job=st.q.shift();try{await job.fn();job.resolve()}catch(e){job.reject(e)}}st.qRun=false}
async function send(cmd,data){if(!st.w)throw new Error("Chưa kết nối");var p=new Uint8Array(frame(cmd,data));try{if(st.w.properties.writeWithoutResponse)await st.w.writeValueWithoutResponse(p);else await st.w.writeValue(p)}catch(e){try{await st.w.writeValue(p)}catch(e2){throw e2}}}
async function sendQ(cmd,data,gap){return enqueue(async function(){await send(cmd,data);if(gap)await sleep(gap)})}
function runNow(){if(st.ok&&st.on&&st.runAt)return st.runAcc+(Date.now()-st.runAt);return st.runAcc}
function tickRun(){setTxt("run",fmtRun(runNow()));paintTimer()}
function paintTimer(){var el=$("timerLeft"),tx=$("timerTxt");if(!st.timerEnd){if(el)el.textContent="";if(tx)tx.textContent="Tắt";return}var left=Math.max(0,st.timerEnd-Date.now());if(left<=0){if(el)el.textContent="";st.timerEnd=0;if(tx)tx.textContent="Tắt";return}var sec=Math.ceil(left/1000),h=Math.floor(sec/3600);sec%=3600;var m=Math.floor(sec/60);sec%=60;var str=h?(pad(h)+":"+pad(m)+":"+pad(sec)):(pad(m)+":"+pad(sec));if(el)el.textContent="Tắt sau "+str;if(tx)tx.textContent=str}
function startRun(){if(!st.runAt)st.runAt=Date.now()}
function stopRun(){if(st.runAt){st.runAcc+=Date.now()-st.runAt;st.runAt=0}tickRun()}
function resetRun(){st.runAcc=0;st.runAt=0;tickRun()}
function startPoll(){stopPoll();st._pi=0;st.poll=setInterval(async function(){if(!st.ok||!st.w||st.ledLock||st.qRun||st.q.length)return;if(Date.now()<st.holdUntil)return;try{var seq=[0x07,0x0C,0x07,0x04];var cmd=seq[st._pi%seq.length];st._pi++;await send(cmd,[])}catch(e){}},1000)}
function stopPoll(){if(st.poll){clearInterval(st.poll);st.poll=null}}
function parseTemps(data){if(data.length>=3&&data[1]<=95&&data[2]<=95)return data[1]<=data[2]?{cold:data[1],hot:data[2]}:{cold:data[2],hot:data[1]};var a=[];for(var i=0;i<data.length;i++){if(i===0||i===3||i===4)continue;if(data[i]>=0&&data[i]<=95)a.push(data[i])}if(a.length>=2){a.sort(function(x,y){return x-y});return{cold:a[0],hot:a[a.length-1]}}return{cold:null,hot:a[0]||null}}
async function applyLed(){if(!st.ok){toast("Kết nối trước");return}if(st.ledLock)return;st.ledLock=true;st.holdUntil=Date.now()+1800;stopPoll();var fx=st.fx|0;try{if(!st.ledOn){await sendQ(0x06,[0],60);toast("Đã tắt đèn");return}await sendQ(0x06,[1],50);await sendQ(0x07,[fx],100);toast(lightName(fx))}catch(e){toast(e.message)}finally{st.ledLock=false;st.holdUntil=Date.now()+600;if(st.ok)startPoll();paint()}}
function setProtUi(){setTxt("protTxt",st.low?"Nhiệt thấp bật":"Nhiệt thấp tắt");var b=$("bProt");if(b)b.className="card"+(st.low?" on":"")}
function save(){try{localStorage.setItem("b3pro",JSON.stringify({mode:st.mode,fx:st.fx,pct:st.pct,low:st.low,ledSpd:st.ledSpd,ledHex:st.ledHex,ledOn:st.ledOn}))}catch(e){}}
function load(){try{var j=JSON.parse(localStorage.getItem("b3pro")||"null");if(!j)return;if(j.mode)st.mode=j.mode;if(j.fx)st.fx=j.fx;if(j.pct)st.pct=j.pct;if(j.low!=null)st.low=j.low;if(j.ledSpd)st.ledSpd=j.ledSpd;if(j.ledHex)st.ledHex=j.ledHex;if(j.ledOn!=null)st.ledOn=j.ledOn}catch(e){}}
function ringSpd(){return {1:"5.5s",2:"4.2s",3:"3.2s",4:"2.2s",5:"1.3s"}[ledSp()]||"3.2s"}
function paintRing(){var el=document.querySelector(".ring");if(!el)return;el.className="ring";if(!st.ledOn){el.classList.add("fx-off");return}el.style.setProperty("--ring-spd",ringSpd());el.style.setProperty("--ring-col",st.ledHex||"#8000FF");var map={1:"fx-flow",2:"fx-breath",3:"fx-chase",4:"fx-soft",5:"fx-solid",6:"fx-star",7:"fx-flow"};el.classList.add(map[st.fx]||"fx-flow");if(lightOf(st.fx).color==="multi")el.style.removeProperty("--ring-col")}
function paint(){if(!$("modeTxt"))return;if(st.rage===1){setTxt("modeTxt","Khóa · Cuồng nộ");setCls("bMode","card");$("bMode").style.opacity=".45"}else if(st.rage===2){setTxt("modeTxt","Khóa · Thông minh");setCls("bMode","card");$("bMode").style.opacity=".45"}else{setTxt("modeTxt",modeName(st.mode));setCls("bMode","card on");$("bMode").style.opacity="1"}setTxt("lightTxt",st.ledOn?lightName(st.fx):"Tắt");setTxt("rageTxt",st.rage===1?("Bật · "+st.pct+"%"):"Tắt");setCls("bRage","card"+(st.rage===1?" on":""));setTxt("smartTxt",st.rage===2?"Bật":"Tắt");setCls("bSmart","card"+(st.rage===2?" on":""));setProtUi();paintRing();paintTimer();setTxt("fwLine","Firmware: "+st.fw+" · YiChip");var box=$("connBox");if(box)box.className=st.ok?"box hide":"box"}
function parse(u){if(!u||u[0]!==0x20||u.length<4)return;var cmd=u[1],len=u[2],data=Array.from(u.slice(3,3+len));if(cmd===0xA5&&data.length>=7){var watt=data[0]|0,rpm=(data[3]|(data[4]<<8));st.lastA5=Date.now();var alive=watt>0||rpm>40;if(alive){st.zeroN=0;st.lastW=watt;st.lastRpm=rpm;setTxt("rpm",rpm+" RPM");setTxt("watt",watt+"W");if(watt>0)setTxt("pps","PPS")}else{st.zeroN++;if(st.zeroN<=2&&st.on&&st.lastRpm!=null){setTxt("rpm",st.lastRpm+" RPM");setTxt("watt",(st.lastW!=null?st.lastW:0)+"W")}else{setTxt("rpm","0 RPM");setTxt("watt","0W");if(!st.on)setTxt("pps","--")}}var tp=parseTemps(data);if(tp.hot!=null&&tp.hot>0){st.lastHot=tp.hot;setTxt("ntcHot",tp.hot+"°C")}else if(st.lastHot!=null)setTxt("ntcHot",st.lastHot+"°C");if(tp.cold!=null&&tp.cold>=0){st.lastCold=tp.cold;setTxt("ntcCold",tp.cold+"°C")}else if(st.lastCold!=null)setTxt("ntcCold",st.lastCold+"°C");pushTemp(tp.hot!=null&&tp.hot>0?tp.hot:st.lastHot,tp.cold!=null?tp.cold:st.lastCold);if(Date.now()>=st.holdUntil&&alive&&!st.on){st.on=true;setCls("pwr","sw on");setTxt("pwrTxt","Bật");startRun()}return}if(cmd===0xA6&&data.length>=4){var on=!!data[0],rg=data[1]|0,md=data[2]|0,pct=data[3]|0;if(rg>2)rg=0;st.on=on;setCls("pwr","sw"+(on?" on":""));setTxt("pwrTxt",on?"Bật":"Tắt");if(on){startRun();st.zeroN=0}else{stopRun();st.zeroN=99}if(Date.now()>=st.holdUntil){st.rage=rg;if(rg===0&&md>=1&&md<=3)st.mode=md;if(rg===1&&pct>=80&&pct<=100)st.pct=pct}paint();save();return}if(cmd===0xA7){if(data.length>=2)st.low=!!data[1];setProtUi();save();return}if(cmd===0xA8){if(st.ledLock)return;if(data.length>=1)st.ledOn=!!data[0];if(data.length>=2&&data[1]>=1&&data[1]<=7)st.fx=data[1];paint()}}
function openSh(html){$("body").innerHTML=html;$("bg").className="bg show";$("sh").className="sh show"}
function closeSh(){$("bg").className="bg";$("sh").className="sh"}
function renderLed(){var list=LIGHT.map(function(m){return '<button class="opt'+(st.fx===m.id?" sel":"")+'" data-fx="'+m.id+'">'+m.name+'</button>'}).join("");openSh("<h3>Hiệu ứng ánh sáng</h3><div class='tog'><span>Đèn LED</span><button class='sw"+(st.ledOn?" on":"")+"' id='ledTog' type='button'><i></i></button></div>"+list+"<p class='hint'>Firmware chỉ hỗ trợ 7 mode cố định.</p>");$("body").onclick=function(e){var b=e.target.closest("[data-fx]");if(b){st.fx=+b.getAttribute("data-fx");st.ledOn=true;save();paint();if(st.ok)applyLed();renderLed()}};$("ledTog").onclick=function(){st.ledOn=!st.ledOn;save();paint();if(st.ok)applyLed();renderLed()}}
function renderRage(){openSh("<h3>Cuồng nộ</h3><div class='tog'><span>Bật cuồng nộ</span><button class='sw"+(st.rage===1?" on":"")+"' id='rTog' type='button'><i></i></button></div><p class='hint'>Tốc độ quạt (80–100%)</p><div class='step'><button type='button' id='rMinus'>−</button><div class='num' id='rNum'>"+st.pct+"%</div><button type='button' id='rPlus'>+</button></div><input id='rRange' type='range' min='80' max='100' value='"+Math.max(80,st.pct)+"'/><div class='row'><button class='btn g' id='rApply' type='button'>Gửi</button></div>");function showPct(){setTxt("rNum",st.pct+"%");$("rRange").value=st.pct;setTxt("rageTxt",st.rage===1?("Bật · "+st.pct+"%"):"Tắt")}async function setOn(on){if(!st.ok){toast("Kết nối trước");return}st.holdUntil=Date.now()+4000;try{if(on){if(st.rage===2)await sendQ(0x09,[0],100);st.rage=1;paint();await sendQ(0x09,[1],100);await sendQ(0x05,[st.pct],60);await sendQ(0x09,[1],40)}else{st.rage=0;paint();await sendQ(0x09,[0],100);await sendQ(0x04,[st.mode>=1&&st.mode<=3?st.mode:3],40)}save();toast(on?"Cuồng nộ ON":"Cuồng nộ OFF")}catch(e){toast(e.message)}renderRage()}$("rTog").onclick=function(){setOn(st.rage!==1)};$("rMinus").onclick=function(){st.pct=Math.max(80,st.pct-1);showPct()};$("rPlus").onclick=function(){st.pct=Math.min(100,st.pct+1);showPct()};$("rRange").oninput=function(){st.pct=+this.value;showPct()};$("rApply").onclick=async function(){if(!st.ok){toast("Kết nối trước");return}if(st.rage!==1){await setOn(true);return}st.holdUntil=Date.now()+3000;try{await sendQ(0x09,[1],50);await sendQ(0x05,[st.pct],40);toast("Quạt "+st.pct+"%");save();paint()}catch(e){toast(e.message)}}}
function renderTimer(){var th=0,tm=30,ts=0;if(st.timerEnd){var left=Math.max(0,st.timerEnd-Date.now());var sec=Math.ceil(left/1000);th=Math.floor(sec/3600);sec%=3600;tm=Math.floor(sec/60);ts=sec%60}function mkOpts(n,cur){var h="";for(var i=0;i<=n;i++)h+="<div data-v='"+i+"' class='"+(i===cur?"on":"")+"'>"+i+"</div>";return h}openSh("<h3>Hẹn giờ tắt</h3><div class='pickers'><div class='pick-col'><div class='lab'>Giờ</div><div class='mid'></div><div class='pick-scroll' id='psH'>"+mkOpts(12,th)+"</div></div><div class='pick-col'><div class='lab'>Phút</div><div class='mid'></div><div class='pick-scroll' id='psM'>"+mkOpts(59,tm)+"</div></div><div class='pick-col'><div class='lab'>Giây</div><div class='mid'></div><div class='pick-scroll' id='psS'>"+mkOpts(59,ts)+"</div></div></div><div class='row'><button class='btn g' id='tGo' type='button'>Đặt hẹn giờ</button><button class='btn n' id='tCancel' type='button'>Huỷ</button></div><p class='hint'>"+(st.timerEnd?"Đang hẹn giờ":"Vuốt lên/xuống")+"</p>");function snap(el){var items=el.querySelectorAll("div[data-v]");var mid=el.scrollTop+el.clientHeight/2;var best=null,bd=1e9;items.forEach(function(it){var c=it.offsetTop+it.offsetHeight/2;var d=Math.abs(c-mid);if(d<bd){bd=d;best=it}});items.forEach(function(it){it.className=it===best?"on":""});return best?+best.getAttribute("data-v"):0}function bind(id,val){var el=$(id);if(!el)return;var item=el.querySelector("div[data-v='"+val+"']");if(item)el.scrollTop=item.offsetTop-(el.clientHeight/2-item.offsetHeight/2);var t;el.addEventListener("scroll",function(){clearTimeout(t);t=setTimeout(function(){var v=snap(el);var it=el.querySelector("div[data-v='"+v+"']");if(it)el.scrollTo({top:it.offsetTop-(el.clientHeight/2-it.offsetHeight/2),behavior:"smooth"})},80)})}bind("psH",th);bind("psM",tm);bind("psS",ts);$("tGo").onclick=function(){th=snap($("psH"));tm=snap($("psM"));ts=snap($("psS"));var total=th*3600+tm*60+ts;if(total<=0){toast("Chọn thời gian > 0");return}if(st.timer)clearTimeout(st.timer);st.timerEnd=Date.now()+total*1000;st.timer=setTimeout(function(){st.timer=null;st.timerEnd=0;paintTimer();power(false);toast("Đã tắt theo lịch")},total*1000);paint();toast("Đã hẹn "+pad(th)+":"+pad(tm)+":"+pad(ts));closeSh()};$("tCancel").onclick=function(){if(st.timer)clearTimeout(st.timer);st.timer=null;st.timerEnd=0;paint();toast("Đã huỷ hẹn giờ");closeSh()}}
var hist={hot:[],cold:[],max:120};
function pushTemp(h,c){hist.hot.push(h!=null?h:(hist.hot.length?hist.hot[hist.hot.length-1]:null));hist.cold.push(c!=null?c:(hist.cold.length?hist.cold[hist.cold.length-1]:null));if(hist.hot.length>hist.max){hist.hot.shift();hist.cold.shift()}if(!drawChart._raf)drawChart._raf=requestAnimationFrame(function(){drawChart._raf=0;drawChart()})}
function drawChart(){var cv=$("tChart");if(!cv)return;var dpr=window.devicePixelRatio||1,w=cv.clientWidth||360,h=120;if(cv.width!==Math.floor(w*dpr)||cv.height!==Math.floor(h*dpr)){cv.width=Math.floor(w*dpr);cv.height=Math.floor(h*dpr)}var ctx=cv.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);var padL=28,padR=8,padT=8,padB=16,iw=w-padL-padR,ih=h-padT-padB;var vals=hist.hot.concat(hist.cold).filter(function(v){return v!=null});var ymin=0,ymax=60;if(vals.length){ymin=Math.max(0,Math.min.apply(null,vals)-3);ymax=Math.min(100,Math.max.apply(null,vals)+3);if(ymax-ymin<10)ymax=ymin+10}function yx(v){return padT+ih*(1-(v-ymin)/(ymax-ymin||1))}function xx(i,n){return padL+(n<=1?iw/2:iw*i/(n-1))}ctx.strokeStyle="#e4e8ef";ctx.lineWidth=1;for(var g=0;g<4;g++){var gy=padT+ih*g/3;ctx.beginPath();ctx.moveTo(padL,gy);ctx.lineTo(padL+iw,gy);ctx.stroke();ctx.fillStyle="#8a91a0";ctx.font="9px sans-serif";ctx.textAlign="right";ctx.fillText(Math.round(ymax-(ymax-ymin)*g/3)+"°",padL-4,gy+3)}function series(arr,color){var pts=[];for(var i=0;i<arr.length;i++)if(arr[i]!=null)pts.push({x:xx(i,arr.length),y:yx(arr[i])});if(pts.length<2)return;ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=2.4;ctx.lineJoin="round";ctx.lineCap="round";ctx.moveTo(pts[0].x,pts[0].y);for(var i=1;i<pts.length-1;i++){var xc=(pts[i].x+pts[i+1].x)/2,yc=(pts[i].y+pts[i+1].y)/2;ctx.quadraticCurveTo(pts[i].x,pts[i].y,xc,yc)}ctx.quadraticCurveTo(pts[pts.length-2].x,pts[pts.length-2].y,pts[pts.length-1].x,pts[pts.length-1].y);ctx.stroke();ctx.beginPath();ctx.fillStyle=color;ctx.arc(pts[pts.length-1].x,pts[pts.length-1].y,3.5,0,Math.PI*2);ctx.fill()}series(hist.hot,"#e84545");series(hist.cold,"#00b8d9")}
async function attach(dev){st.dev=dev;var server=await dev.gatt.connect();var svc=await server.getPrimaryService(SVC);st.w=await svc.getCharacteristic(TX);var n=await svc.getCharacteristic(RX);await n.startNotifications();n.addEventListener("characteristicvaluechanged",function(ev){parse(new Uint8Array(ev.target.value.buffer))});dev.addEventListener("gattserverdisconnected",function(){stopPoll();stopRun();st.ok=false;st.w=null;setCls("dot","dot");setTxt("conn","Mất kết nối");paint();toast("Mất kết nối")});st.ok=true;st.holdUntil=Date.now()+2000;st.zeroN=0;setTxt("pwrTxt","…");setCls("dot","dot ok");setTxt("conn","Đã kết nối");resetRun();paint();startPoll();try{await sendQ(0x07,[],40);await sendQ(0x0C,[],40);await sendQ(0x04,[],40)}catch(e){}toast("Đã kết nối")}
async function ask(){if(!navigator.bluetooth){toast("Cần Chrome Android");return}try{await attach(await navigator.bluetooth.requestDevice({filters:[{name:"B3PRO"},{namePrefix:"B3PRO"}],optionalServices:[SVC,"generic_access","device_information"]}))}catch(e){toast(e.message||"Không kết nối được")}}
function disconnect(){try{st.dev&&st.dev.gatt&&st.dev.gatt.disconnect()}catch(e){}stopPoll();stopRun();st.ok=false;st.w=null;setCls("dot","dot");setTxt("conn","Chưa kết nối");paint()}
async function power(on){st.on=on;st.holdUntil=Date.now()+2500;setCls("pwr","sw"+(on?" on":""));setTxt("pwrTxt",on?"Bật":"Tắt");if(on)startRun();else stopRun();if(st.ok)try{await sendQ(0x0A,[on?1:0],20)}catch(e){toast(e.message)}}
var volLevel=0.8,volMuted=false;
function applyVol(){
  var vid=$("coolVid");if(!vid)return;
  vid.muted=volMuted||volLevel<=0;
  vid.volume=Math.max(0,Math.min(1,volLevel));
  var pct=$("volPct"),rng=$("volRange"),btn=$("btnMute");
  if(pct)pct.textContent=Math.round((volMuted?0:volLevel)*100)+"%";
  if(rng)rng.value=Math.round((volMuted?0:volLevel)*100);
  if(btn)btn.textContent=(volMuted||volLevel<=0)?"🔇":"🔊";
}
var DEFAULT_COOL="https://raw.githubusercontent.com/thaibao-byte/piva-b3pro-control/main/b3pro.png";
var mediaBlob=null;
function showDefaultCool(){
  var img=$("coolImg"),vid=$("coolVid"),wrap=$("coolWrap"),rst=$("btnMediaReset");
  if(vid){vid.pause();vid.removeAttribute("src");vid.load();vid.classList.add("hide")}
  if(img){img.src=DEFAULT_COOL;img.classList.remove("custom","hide")}
  if(wrap)wrap.classList.remove("has-custom");
  if(rst)rst.classList.add("hide");
  var vw=$("volWrap");if(vw)vw.classList.add("hide");
  if(mediaBlob){try{URL.revokeObjectURL(mediaBlob)}catch(e){}mediaBlob=null}
  try{localStorage.removeItem("b3pro_media")}catch(e){}
}
function showCustomMedia(url,isVideo){
  var img=$("coolImg"),vid=$("coolVid"),wrap=$("coolWrap"),rst=$("btnMediaReset");
  if(isVideo){
    if(img)img.classList.add("hide");
    if(vid){vid.src=url;vid.classList.remove("hide");vid.play().catch(function(){})}
  }else{
    if(vid){vid.pause();vid.classList.add("hide");vid.removeAttribute("src")}
    if(img){img.src=url;img.classList.add("custom");img.classList.remove("hide")}
  }
  if(wrap)wrap.classList.add("has-custom");
  if(rst)rst.classList.remove("hide");
  var vw=$("volWrap");if(vw){if(isVideo){vw.classList.remove("hide");applyVol()}else vw.classList.add("hide")}
}
function loadSavedMedia(){
  try{
    var j=JSON.parse(localStorage.getItem("b3pro_media")||"null");
    if(!j||!j.data)return;
    if(j.type&&j.type.indexOf("video")===0)return;
    showCustomMedia(j.data,false);
  }catch(e){}
}
function onMediaFile(file){
  if(!file)return;
  var isVid=file.type.indexOf("video")===0;
  if(mediaBlob){try{URL.revokeObjectURL(mediaBlob)}catch(e){}}
  mediaBlob=URL.createObjectURL(file);
  showCustomMedia(mediaBlob,isVid);
  if(isVid){
    var v=$("coolVid");
    if(v){
      v.muted=false;volMuted=false;applyVol();
      v.play().catch(function(){v.muted=true;volMuted=true;applyVol();v.play().catch(function(){})});
    }
  }
  if(!isVid&&file.size<2.5e6){
    var r=new FileReader();
    r.onload=function(){try{localStorage.setItem("b3pro_media",JSON.stringify({type:file.type,data:r.result}))}catch(e){}};
    r.readAsDataURL(file);
  }else{
    try{localStorage.removeItem("b3pro_media")}catch(e){}
  }
  toast(isVid?"Đã gắn video":"Đã đổi ảnh");
}
load();loadSavedMedia();paint();drawChart();setInterval(tickRun,1000);window.addEventListener("resize",function(){drawChart()});
$("connect").onclick=ask;
$("back").onclick=function(){if(st.ok)disconnect();else ask()};
$("bg").onclick=closeSh;
$("pwr").onclick=function(){if(!st.ok){toast("Kết nối trước");return}power(!st.on)};
$("menu").onclick=function(){openSh("<h3>Tùy chọn</h3>"+(st.ok?"<button class='opt r' id='mDis' type='button'>Ngắt kết nối</button>":"")+"<button class='opt' id='mReset' type='button'>Reset sò (khi lỗi)</button><button class='opt' id='mFw' type='button'>Thông tin firmware</button>");var d=$("mDis");if(d)d.onclick=function(){closeSh();disconnect()};$("mFw").onclick=function(){openSh("<h3>Firmware</h3><p class='hint'>Phiên bản: <b>"+st.fw+"</b><br>Chip: YiChip<br>LED: 7 mode cố định</p>")};$("mReset").onclick=async function(){if(!st.ok){toast("Kết nối trước");return}closeSh();st.holdUntil=Date.now()+4000;try{await sendQ(0x0A,[0],200);await sendQ(0x06,[0],120);await sendQ(0x09,[0],120);await sendQ(0x04,[st.mode>=1&&st.mode<=3?st.mode:3],80);await sendQ(0x07,[1],60);await sendQ(0x0C,[st.low?1:0],40);st.rage=0;st.on=false;st.ledOn=false;paint();toast("Đã reset")}catch(e){toast(e.message)}}};
$("bMode").onclick=function(){if(!st.ok){toast("Kết nối trước");return}if(st.rage===1){toast("Tắt Cuồng nộ trước");return}if(st.rage===2){toast("Tắt Thông minh trước");return}openSh("<h3>Hiệu suất</h3>"+MODE.map(function(m){return '<button class="opt'+(st.mode===m.id?" sel":"")+'" data-id="'+m.id+'">'+m.name+'</button>'}).join(""));$("body").onclick=async function(e){var b=e.target.closest("[data-id]");if(!b)return;st.mode=+b.getAttribute("data-id");st.holdUntil=Date.now()+3000;paint();save();closeSh();try{await sendQ(0x04,[st.mode],50);toast(modeName(st.mode))}catch(err){toast(err.message)}}};
$("bLight").onclick=renderLed;
$("bRage").onclick=renderRage;
$("bSmart").onclick=async function(){if(!st.ok){toast("Kết nối trước");return}var on=st.rage!==2;st.holdUntil=Date.now()+4000;try{if(on){if(st.rage===1)await sendQ(0x09,[0],100);st.rage=2;paint();await sendQ(0x09,[2],100);await sendQ(0x09,[2],40)}else{st.rage=0;paint();await sendQ(0x09,[0],100);await sendQ(0x04,[st.mode>=1&&st.mode<=3?st.mode:3],40)}save();toast(on?"Thông minh ON":"Thông minh OFF")}catch(e){toast(e.message)}};
$("bProt").onclick=function(){openSh("<h3>Cơ chế bảo vệ</h3><div class='tog'><span>Bảo vệ nhiệt thấp</span><button class='sw"+(st.low?" on":"")+"' id='pTog' type='button'><i></i></button></div><p class='hint'>Khi bật: sò tự giảm/tắt nếu mặt lạnh quá thấp.</p>");$("pTog").onclick=async function(){if(!st.ok){toast("Kết nối trước");return}var v=!st.low;try{await sendQ(0x0C,[v?1:0],40);st.low=v;setProtUi();save();paint();toast(v?"Nhiệt thấp ON":"Nhiệt thấp OFF");$("pTog").className="sw"+(v?" on":"")}catch(e){toast(e.message)}}};
$("bTimer").onclick=renderTimer;
var _bm=$("btnMedia");if(_bm)_bm.onclick=function(){var i=$("mediaInput");if(i)i.click()};
var _br=$("btnMediaReset");if(_br)_br.onclick=function(){showDefaultCool();toast("Đã về ảnh gốc")};
var _mi=$("mediaInput");if(_mi)_mi.onchange=function(){var f=this.files&&this.files[0];if(f)onMediaFile(f);this.value=""};
var _vr=$("volRange");if(_vr)_vr.oninput=function(){volLevel=this.value/100;volMuted=volLevel<=0;applyVol()};
var _mute=$("btnMute");if(_mute)_mute.onclick=function(){volMuted=!volMuted;if(!volMuted&&volLevel<=0)volLevel=0.5;applyVol()};
})();
