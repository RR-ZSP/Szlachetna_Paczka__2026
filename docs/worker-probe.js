'use strict';
self.__sp26_workerprobe12345=function(data){self.postMessage({kind:'response',data:data});};
self.onmessage=function(event){
  try{
    const u=new URL(event.data.url);
    if(u.protocol!=='https:'||u.hostname!=='script.google.com'||!u.pathname.endsWith('/exec'))throw Error('Niepoprawny adres API');
    u.searchParams.set('action','items');
    u.searchParams.set('callback','__sp26_workerprobe12345');
    u.searchParams.set('_',String(Date.now()));
    importScripts(u.toString());
    self.postMessage({kind:'finished'});
  }catch(err){self.postMessage({kind:'error',message:String(err&&err.message||err)});}
};