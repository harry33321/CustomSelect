import CustomSelect from "../components/CustomSelect.js";

document.addEventListener('DOMContentLoaded', (event) => {
    document.querySelectorAll('pre code').forEach((el) => {
        el.innerHTML = formatCode(el.innerHTML);
    });

    document.querySelectorAll('.selectWrapper').forEach((el) => {
        const selectHtml = el.querySelector('select').outerHTML;

        const codeHtml = formatCode(selectHtml);

        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.innerHTML = codeHtml;
        pre.appendChild(code);
        el.insertAdjacentElement('afterend', pre);
    });

    hljs.highlightAll();

    const customSelect_single = new CustomSelect("#customSelect_single");
    const customSelect_multiple = new CustomSelect("#customSelect_multiple");
    const customSelect_placeholder = new CustomSelect("#customSelect_placeholder");
    const customSelect_checkbox = new CustomSelect("#customSelect_checkbox", {
        settings: {
            checkboxMode: true,
        },
    });
    const customSelect_sortMode = new CustomSelect("#customSelect_sortMode", {
        settings: {
            closeOnSelect: false,
            searchEnable: false,
            sortMode: true,
            checkboxMode: true,
            maxValuesShown: -1,
            maxValuesLabel: "Column Setting",
        },
        events: {
            afterSort: (newOptions) => {
                console.log(newOptions);
            },
        }
    });
});

function formatCode(code) {
    // escape html
    code = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // remove =""
    code = code.replace(/=""/g, '');

    // remove all space
    code = code.trim();

    // remove spaces at the beginning of each line
    let lines = code.split('\n');
    let minSpace = 999;
    lines.forEach((line, index) => {
        if (index === 0) return;
        if (line.length > 0) {
            let space = 0;
            while (line[space] === ' ') {
                space++;
            }
            if (space < minSpace) {
                minSpace = space;
            }
        }
    });
    lines.forEach((line, index) => {
        if (index === 0) return;
        lines[index] = line.slice(minSpace);
    });
    code = lines.join('\n');

    return code;
}
