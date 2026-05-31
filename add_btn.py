import re
import os

# Check if a string contains 'btn' as a standalone class token (space-separated)
def has_standalone_btn(s):
    """True if 'btn' appears as a standalone space-separated token in string s."""
    return bool(re.search(r'(?:^|[ "\'`{])btn(?:[ "\'`}]|$)', s))


def add_btn_to_buttons(content):
    """
    Add 'btn' class to all <button elements in JSX content.
    Rules:
    - No className -> add className="btn"
    - className="xyz" -> className="btn xyz"
    - className={`...`} -> className={`btn ...`}
    - className={cn(...)} -> className={cn('btn', ...)}
    - Already has standalone 'btn' token -> skip
    """

    def process_button_tag(tag):
        # Top-level check: does this tag already have standalone 'btn'?
        if has_standalone_btn(tag):
            return tag

        # No className at all -> add it
        if 'className' not in tag:
            return re.sub(r'(<button)(\s)', r'\1\2className="btn" ', tag, count=1)

        # className="..."
        if re.search(r'className="', tag):
            def repl_dq(m):
                val = m.group(1)
                return f'className="btn {val}"' if val.strip() else 'className="btn"'
            return re.sub(r'className="([^"]*)"', repl_dq, tag, count=1)

        # className='...'
        if re.search(r"className='", tag):
            def repl_sq(m):
                val = m.group(1)
                return f"className='btn {val}'" if val.strip() else "className='btn'"
            return re.sub(r"className='([^']*)'", repl_sq, tag, count=1)

        # className={`...`} - template literal
        tl_match = re.search(r'className=\{`([^`]*)`\}', tag, re.DOTALL)
        if tl_match:
            def repl_tl(m):
                val = m.group(1)
                return f'className={{`btn {val}`}}' if val.strip() else 'className={`btn`}'
            return re.sub(r'className=\{`([^`]*)`\}', repl_tl, tag, count=1, flags=re.DOTALL)

        # className={cn(...)} pattern
        if re.search(r'className=\{cn\(', tag):
            def repl_cn(m):
                inner = m.group(1)
                return f"className={{cn('btn', {inner})}}"
            return re.sub(r'className=\{cn\(([^}]*)\)\}', repl_cn, tag, count=1)

        # Dynamic expression className={expr} - wrap with template literal
        dyn_match = re.search(r'className=\{([^}]+)\}', tag)
        if dyn_match:
            expr = dyn_match.group(1)
            return tag[:dyn_match.start()] + f'className={{`btn ${{{expr}}}`}}' + tag[dyn_match.end():]

        return tag

    result = []
    i = 0
    n = len(content)

    while i < n:
        if content[i:i+7] == '<button' and (i + 7 >= n or content[i+7] in ' \t\n\r>'):
            # Collect the full opening tag
            j = i + 7
            depth_brace = 0
            in_dq = False
            in_sq = False
            in_bt = False  # backtick

            while j < n:
                c = content[j]
                prev = content[j-1] if j > 0 else ''

                if in_dq:
                    if c == '"' and prev != '\\':
                        in_dq = False
                elif in_sq:
                    if c == "'" and prev != '\\':
                        in_sq = False
                elif in_bt:
                    if c == '`' and prev != '\\':
                        in_bt = False
                else:
                    if c == '"':
                        in_dq = True
                    elif c == "'":
                        in_sq = True
                    elif c == '`':
                        in_bt = True
                    elif c == '{':
                        depth_brace += 1
                    elif c == '}':
                        depth_brace -= 1
                    elif c == '>' and depth_brace == 0:
                        break
                j += 1

            tag = content[i:j+1]
            new_tag = process_button_tag(tag)
            result.append(new_tag)
            i = j + 1
        else:
            result.append(content[i])
            i += 1

    return ''.join(result)


# Files to process
FILES = [
    r'C:\Users\HP\braille\src\components\BrailleKlavye.jsx',
    r'C:\Users\HP\braille\src\components\CokHucreOkuyucu.jsx',
    r'C:\Users\HP\braille\src\components\CokluTest.jsx',
    r'C:\Users\HP\braille\src\components\DesenOgretici.jsx',
    r'C:\Users\HP\braille\src\components\DesktopShell.jsx',
    r'C:\Users\HP\braille\src\components\FullscreenButonu.jsx',
    r'C:\Users\HP\braille\src\components\GorunumGecisi.jsx',
    r'C:\Users\HP\braille\src\components\IsaretSayfasi.jsx',
    r'C:\Users\HP\braille\src\components\KarisikYazmaButonu.jsx',
    r'C:\Users\HP\braille\src\components\OkumaModu.jsx',
    r'C:\Users\HP\braille\src\components\PageHeader.jsx',
    r'C:\Users\HP\braille\src\components\SesIzinEkrani.jsx',
    r'C:\Users\HP\braille\src\components\TanitimTuru.jsx',
    r'C:\Users\HP\braille\src\pages\AlmancaBrailleMenu.jsx',
    r'C:\Users\HP\braille\src\pages\AnaMenu.jsx',
    r'C:\Users\HP\braille\src\pages\Araclar.jsx',
    r'C:\Users\HP\braille\src\pages\Ayarlar.jsx',
    r'C:\Users\HP\braille\src\pages\BelgeBrf.jsx',
    r'C:\Users\HP\braille\src\pages\BrfOku.jsx',
    r'C:\Users\HP\braille\src\pages\FransizcaBrailleMenu.jsx',
    r'C:\Users\HP\braille\src\pages\HucreTanima.jsx',
    r'C:\Users\HP\braille\src\pages\IngilizceBrailleMenu.jsx',
    r'C:\Users\HP\braille\src\pages\KisaltmaBirHarfli.jsx',
    r'C:\Users\HP\braille\src\pages\KisaltmaHece.jsx',
    r'C:\Users\HP\braille\src\pages\KisaltmaIkiHarfli.jsx',
    r'C:\Users\HP\braille\src\pages\KisaltmaKelimeKoku.jsx',
    r'C:\Users\HP\braille\src\pages\KisaltmaKelimeParcasi.jsx',
    r'C:\Users\HP\braille\src\pages\KuranSureOkuma.jsx',
    r'C:\Users\HP\braille\src\pages\MuzikSureleri.jsx',
    r'C:\Users\HP\braille\src\pages\Test.jsx',
    r'C:\Users\HP\braille\src\pages\TestKisaltma.jsx',
    r'C:\Users\HP\braille\src\pages\TestKuran.jsx',
    r'C:\Users\HP\braille\src\pages\TestNoktalama.jsx',
    r'C:\Users\HP\braille\src\pages\YazmaEgitimi.jsx',
    r'C:\Users\HP\braille\src\pages\YazmaKarisik.jsx',
    r'C:\Users\HP\braille\src\pages\YazmaSerbest.jsx',
    r'C:\Users\HP\braille\src\pages\YazmaYonergeli.jsx',
    r'C:\Users\HP\braille\src\pages\YazmaYonergeliCumle.jsx',
    r'C:\Users\HP\braille\src\pages\_cop_kutusu\KisaltmaEgitimi.jsx',
    r'C:\Users\HP\braille\src\pages\_cop_kutusu\KisaltmaTanima.jsx',
]

changed = 0
skipped = 0

for fpath in FILES:
    if not os.path.exists(fpath):
        print(f'MISSING: {fpath}')
        skipped += 1
        continue

    with open(fpath, 'r', encoding='utf-8') as f:
        original = f.read()

    modified = add_btn_to_buttons(original)

    if modified != original:
        with open(fpath, 'w', encoding='utf-8') as f:
            f.write(modified)
        print(f'CHANGED: {fpath}')
        changed += 1
    else:
        print(f'NO_CHANGE: {fpath}')

print(f'\nTotal: {changed} changed, {skipped} skipped/missing')
