# custom-select

[Demo](https://harry33321.github.io/custom-select/)

## Installation

```bash
npm install custom-select.js
```

### or

```html
<script src="https://cdn.jsdelivr.net/npm/custom-select.js@latest/customselect.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/custom-select.js@latest/customselect.min.css" />
```

## Configs

```js
/********** HTML **********/
<select id="customSelect" multiple>
    <option value="" data-placeholder="true" selected disabled hidden>Please select</option>
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <optgroup label="Group 1" data-expanded="off">
        <option value="3">Option 3</option>
        <option value="4">Option 4</option>
        <option value="5">Option 5</option>
    </optgroup>
</select>

/*********** js ***********/
const customSelect = new CustomSelect("#customSelect", {
    options: [                          // if options is empty, it will get options from HTML select element
        <!-- option config -->
        {
            label: "Option 1",          // Required
            value: "Option 1",          // Optional - if value is empty, it will be same as label
            id: "1",                    // Optional - if id is empty, it will be generated automatically
            placeholder: false,         // Optional - if placeholder is true, it will be light gray color as placeholder when it is selected & the value will be empty
            selected: false,            // Optional
            disabled: false,            // Optional
            hidden: false,              // Optional
            class: "",                  // Optional
            style: "",                  // Optional
        },
        <!-- optgroup config -->
        { 
            label: "Group 1",           // Required - if options is set, it will be a group label
            options: [                  // Optional - support multiple level
                { label: "Option 2", value: "Option 2" },
                { label: "Option 3", value: "Option 3" },
            ],
            groupExpanded: "off",       // Optional - true (default) || false || "off"
        },
    ],
    settings: {                        
        alwaysOpen: false,
        closeOnSelect: true,
        openDirection: "auto",               // "auto" (default) || "up" || "down"
        openPosition: "absolute",            // "absolute" (default) || "relative"
        openLocation: "body",                // HTML element || css selector
        searchEnable: true,
        searchPlaceholder: "Search",
        searchNoResult: "No result",
        searchMark: true,
        selectedOptionHidden: false,
        checkboxMode: false,
        sortMode: false,
        maxValuesShown: 20,
        maxValuesLabel: "{count} selected",  // {count} will be replaced with the number of selected values
        classNames: {                        // e.g. { select: "class1 class2 class3" }
            select: "cs-select",
            label: "cs-label",
            dropdown: "cs-dropdown",
            listing: "cs-listing",
            option: "cs-option",
            optionGroup: "cs-optionGroup",
            optionGroupLabel: "cs-optionGroup-label",
            optionGroupExpandInput: "cs-optionGroup-expandInput",
            optionGroupListing: "cs-optionGroup-listing",
            arrow: "cs-arrow",
            checkbox: "cs-checkbox",
            relative: "cs-relative",
            openUp: "cs-open-up",
            openDown: "cs-open-down",
            selected: "cs-selected",
            highlighted: "cs-highlighted",
            disabled: "cs-disabled",
            hidden: "cs-hidden",
            selectedHidden: "cs-selectedHidden",
            placeholder: "cs-placeholder",
            searchWrapper: "cs-searchWrapper",
            search: "cs-search",
            searchNoResult: "cs-searchNoResult",
            searchMark: "cs-searchMark",
            selectedItem: "cs-selectedItem",
            selectedItemLabel: "cs-selectedItem-label",
            selectedItemRemove: "cs-selectedItem-remove",
        },
    },
    events: {
        beforeOpen: () => {
            console.log('beforeOpen');
        },
        afterOpen: () => {
            console.log('afterOpen');
        },
        beforeClose: () => {
            console.log('beforeClose');
        },
        afterClose: () => {
            console.log('afterClose');
        },
        beforeChange: (newVal, oldVal) => {
            console.log("[newVal]", newVal);
            console.log("[oldVal]", oldVal);
            // return false will stop the change from happening
        },
        afterChange: (newVal) => {
            console.log("[newVal]", newVal);
        },
        afterSort: (newOptions) => {
            console.log("[newOptions]", newOptions);
        },
    }
});

customSelect.getSelectedValue();              // return string || array (if multiple select)
customSelect.setSelectedValue("value");       // if multiple select, value can be array
customSelect.getSelectedObj();
customSelect.getOptionElBy("key", "value");
customSelect.getOptionObjBy("key", "value");
customSelect.getOptions();
customSelect.setOptions([]);
customSelect.enable();
customSelect.disable();                       // it will revert to the original select element
customSelect.destroy();
customSelect.getSortedOptions();
```