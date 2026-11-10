(async () => {
  const fs = require('fs');
  const paths = ['src/pages/Analysis.tsx', 'src/pages/Processing.tsx', 'src/pages/ShareSetup.tsx', 'supabase/functions/analyze/index.ts', 'supabase/functions/analyze/clocked.ts', 'supabase/functions/analyze/resilience.ts'];
  for (const path of paths) {
    const response = await fetch('https://raw.githubusercontent.com/shalynmonet/curilens/86ce179/' + path);
    if (!response.ok) throw new Error('Download failed: ' + path);
    fs.writeFileSync(path, await response.text());
    console.log('Updated ' + path);
  }
  console.log('Recovery source installed. Publish frontend; redeploy analyze before testing server recovery.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
