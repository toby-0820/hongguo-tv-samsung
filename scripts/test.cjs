const fs=require('fs'),path=require('path'),cp=require('child_process');
const dir=path.join(__dirname,'../tests');
for(const file of fs.readdirSync(dir).filter(name=>name.endsWith('.cjs')).sort()){
  const result=cp.spawnSync(process.execPath,[path.join(dir,file)],{stdio:'inherit'});
  if(result.status!==0)process.exit(result.status||1);
}
