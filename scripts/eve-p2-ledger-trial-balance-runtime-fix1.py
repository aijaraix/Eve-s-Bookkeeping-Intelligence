from pathlib import Path
p=Path('scripts/eve-p2-ledger-trial-balance-runtime-apply.py')
t=p.read_text()
marker="insert_helper=r'''"
start=t.index(marker)
end=t.index("'''", start+len(marker))+3
block=t[start:end]
fixed=block.replace('\\n','\n')
if fixed==block:
    raise SystemExit('TRIAL_BALANCE_CONTINUATION_NEWLINE_FIX_NOT_APPLIED')
p.write_text(t[:start]+fixed+t[end:])
print('TRIAL_BALANCE_CONTINUATION_NEWLINE_FIX=PASS')
