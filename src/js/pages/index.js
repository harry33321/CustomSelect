import CustomSelect from "../components/CustomSelect.js";
// import CustomSelect from "custom-select.js";

document.addEventListener("DOMContentLoaded", (event) => {
    document.querySelectorAll("pre code").forEach((el) => {
        el.innerHTML = formatCode(el.innerHTML);
    });

    document.querySelectorAll(".selectWrapper").forEach((el) => {
        const selectHtml = el.querySelector("select").outerHTML;

        const codeHtml = formatCode(selectHtml);

        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.classList.add("language-html");
        code.innerHTML = codeHtml;
        pre.appendChild(code);
        el.insertAdjacentElement("afterend", pre);
    });

    hljs.highlightAll();

    const customSelect_single = new CustomSelect("#customSelect_single");
    const customSelect_multiple = new CustomSelect("#customSelect_multiple");
    const customSelect_placeholder = new CustomSelect("#customSelect_placeholder");
    const customSelect_inlineCSS = new CustomSelect("#customSelect_inlineCSS");
    const customSelect_allowDeselectAll = new CustomSelect("#customSelect_allowDeselectAll", {
        settings: {
            allowDeselectAll: true,
        },
    });
    const customSelect_alwaysOpen = new CustomSelect("#customSelect_alwaysOpen", {
        settings: {
            alwaysOpen: true,
            openPosition: "relative",
            openLocation: document.querySelector("#customSelect_alwaysOpen").parentElement,
        },
    });
    const customSelect_closeOnSelect = new CustomSelect("#customSelect_closeOnSelect", {
        settings: {
            closeOnSelect: false,
        },
    });
    const customSelect_openDirection = new CustomSelect("#customSelect_openDirection", {
        settings: {
            openDirection: "up",
        },
    });
    const customSelect_openPosition = new CustomSelect("#customSelect_openPosition", {
        settings: {
            openPosition: "relative", // "absolute" (default) || "relative"
            openLocation: document.querySelector("#customSelect_openPosition").parentElement,
        },
    });
    const customSelect_openLocation = new CustomSelect("#customSelect_openLocation", {
        settings: {
            openLocation: "body",
        },
    });
    const customSelect_searchEnable = new CustomSelect("#customSelect_searchEnable", {
        settings: {
            searchEnable: false,
        },
    });
    const customSelect_searchPlaceholder = new CustomSelect("#customSelect_searchPlaceholder", {
        settings: {
            searchPlaceholder: "input search text here",
        },
    });
    const customSelect_searchNoResult = new CustomSelect("#customSelect_searchNoResult", {
        settings: {
            searchNoResult: "result not found",
        },
    });
    const customSelect_searchMark = new CustomSelect("#customSelect_searchMark", {
        settings: {
            searchMark: false,
        },
    });
    const customSelect_selectedOptionHidden = new CustomSelect("#customSelect_selectedOptionHidden", {
        settings: {
            searchEnable: false,
            selectedOptionHidden: true,
        },
    });
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
        },
    });
    const customSelect_maxValuesShown = new CustomSelect("#customSelect_maxValuesShown", {
        settings: {
            maxValuesShown: 1,
        },
    });
    const customSelect_maxValuesLabel = new CustomSelect("#customSelect_maxValuesLabel", {
        settings: {
            maxValuesShown: 1,
            maxValuesLabel: "{count} values selected",
        },
    });
    const customSelect_allowHTML = new CustomSelect("#customSelect_allowHTML", {
        options: [
            {
                label: "<u>Option 1</u>",
                value: "1",
            },
            {
                label: "<b>Option 2</b>",
                value: "2",
            },
        ],
        settings: {
            allowHTML: true,
        },
    });

    window.scrollTo({
        top: getScrollTopValue(window.location.hash),
        behavior: "smooth",
    });

    const itemList = document.querySelectorAll('.container');
    const navList = document.querySelectorAll('nav a');
    window.addEventListener("scroll", (event) => {
        const headerHeight = document.querySelector('header')?.clientHeight || 0;
        const scrollTop = window.scrollY;
        const scrollValue = scrollTop - headerHeight;

        itemList.forEach((item, index) => {
            console.log(scrollValue, item.offsetTop)
            if (scrollValue >= item.offsetTop - 40) {
                navList.forEach((item2, index2) => {
                    item2.classList.remove('active');

                    if (item.id === item2.getAttribute('href').replace('#', '')) {
                        item2.classList.add('active');
                    }
                });
            }
        });
    });
});

function formatCode(code) {
    // escape html
    code = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // remove =""
    code = code.replace(/=""/g, "");

    // remove all space
    code = code.trim();

    // remove spaces at the beginning of each line
    let lines = code.split("\n");
    let minSpace = 999;
    lines.forEach((line, index) => {
        if (index === 0) return;
        if (line.length > 0) {
            let space = 0;
            while (line[space] === " ") {
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
    code = lines.join("\n");

    return code;
}

function getScrollTopValue(target) {
    const element = typeof target === "string" ? document.querySelector(target) : target;
    const elementTop = element.getBoundingClientRect().top + window.scrollY;
    const headerHeight = document.querySelector("header")?.offsetHeight || 0;

    return elementTop - headerHeight;
}

