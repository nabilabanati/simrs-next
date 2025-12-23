# Script to update all loket patient files
$lokets = 1..5

foreach ($loket in $lokets) {
    Write-Host "Processing Loket $loket..."
    
    # Update patients.tsx
    $file = "pages\counter\loket-$loket\patients.tsx"
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        # Fix imports
        $content = $content -replace "import \{ CounterLayout \} from '@/components/layout/CounterLayout';`r?`n", ""
        $content = $content -replace "const \{ returnTo \} = router\.query;[\s\S]*?const loketId = .*?;", "const loketId = $loket;"
        # Fix redirects
        $content = $content -replace "/counter/patients", "/counter/loket-$loket/patients"
        $content = $content -replace "returnTo as string \|\| '/counter'", "'/counter/loket-$loket'"
        $content = $content -replace "isFromLoket && returnTo &&", ""
        $content = $content -replace "isFromLoket && loketId", "true"
        $content = $content -replace "returnTo as string", "'/counter/loket-$loket'"
        $content = $content -replace "Kembali ke Loket \{loketId\}", "Kembali ke Loket $loket"
        # Fix layout
        $content = $content -replace "if \(isFromLoket && loketId\) \{[\s\S]*?return <LoketLayout[\s\S]*?return <CounterLayout>.*?</CounterLayout>;", "return <LoketLayout loketId={loketId}>{renderContent()}</LoketLayout>;"
        Set-Content $file $content -NoNewline
    }
    
    # Update create.tsx
    $file = "pages\counter\loket-$loket\patients\create.tsx"
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace "import \{ CounterLayout \} from '@/components/layout/CounterLayout';`r?`n", ""
        $content = $content -replace "const \{ returnTo \} = router\.query;[\s\S]*?const loketId = .*?;", "const loketId = $loket;"
        $content = $content -replace "/counter/patients", "/counter/loket-$loket/patients"
        $content = $content -replace "returnTo as string \|\| '/counter/patients'", "'/counter/loket-$loket/patients'"
        $content = $content -replace "returnTo as string \|\| '/counter'", "'/counter/loket-$loket'"
        $content = $content -replace "if \(isFromLoket && loketId\) \{[\s\S]*?return <LoketLayout[\s\S]*?return <CounterLayout>.*?</CounterLayout>;", "return <LoketLayout loketId={loketId}>{renderContent()}</LoketLayout>;"
        Set-Content $file $content -NoNewline
    }
    
    # Update detail/[id].tsx
    $file = "pages\counter\loket-$loket\patients\detail\[id].tsx"
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace "import \{ CounterLayout \} from '@/components/layout/CounterLayout';`r?`n", ""
        $content = $content -replace "const \{ id, returnTo \} = router\.query;[\s\S]*?const loketId = .*?;", "const { id } = router.query;`r`n    const loketId = $loket;"
        $content = $content -replace "/counter/patients", "/counter/loket-$loket/patients"
        $content = $content -replace "returnTo as string \|\| '/counter/patients'", "'/counter/loket-$loket/patients'"
        $content = $content -replace "if \(isFromLoket && loketId\) \{[\s\S]*?return <LoketLayout[\s\S]*?return <CounterLayout>.*?</CounterLayout>;", "return <LoketLayout loketId={loketId}>{renderContent()}</LoketLayout>;"
        Set-Content $file $content -NoNewline
    }
    
    # Update edit/[id].tsx
    $file = "pages\counter\loket-$loket\patients\edit\[id].tsx"
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $content = $content -replace "import \{ CounterLayout \} from '@/components/layout/CounterLayout';`r?`n", ""
        $content = $content -replace "const \{ id, returnTo \} = router\.query;[\s\S]*?const loketId = .*?;", "const { id } = router.query;`r`n    const loketId = $loket;"
        $content = $content -replace "/counter/patients", "/counter/loket-$loket/patients"
        $content = $content -replace "returnTo as string \|\| '/counter/patients'", "'/counter/loket-$loket/patients'"
        $content = $content -replace "if \(isFromLoket && loketId\) \{[\s\S]*?return <LoketLayout[\s\S]*?return <CounterLayout>.*?</CounterLayout>;", "return <LoketLayout loketId={loketId}>{renderContent()}</LoketLayout>;"
        Set-Content $file $content -NoNewline
    }
}

Write-Host "Done! All loket files updated."
