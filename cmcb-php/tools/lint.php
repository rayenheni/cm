<?php
$root = dirname(__DIR__);
$files = array_merge(glob("$root/src/*.php"), glob("$root/templates/*.php"), glob("$root/templates/partials/*.php"), glob("$root/public/*.php"), glob("$root/tests/*.php"), glob("$root/bin/*.php"));
$bad = 0;
foreach ($files as $f) { $code = file_get_contents($f); try { token_get_all($code, TOKEN_PARSE); } catch (Throwable $e) { echo "FAIL $f: {$e->getMessage()}\n"; $bad++; } }
echo $bad ? "$bad errors\n" : "All " . count($files) . " PHP files parse.\n"; exit($bad ? 1 : 0);
