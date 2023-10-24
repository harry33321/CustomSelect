# custom-select

[Demo](https://harry33321.github.io/custom-select/)

## Installation

With [NPM](https://www.npmjs.com/package/custom-select.js):

```bash
npm install custom-select.js
```

From a [CDN](https://www.jsdelivr.com/package/npm/custom-select.js):

**Note:** There is sometimes a delay before the latest version of Choices is reflected on the CDN.

```html
<script src="https://cdn.jsdelivr.net/npm/custom-select.js@latest/customselect.all.min.js"></script>

<!-- or -->

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/custom-select.js@latest/customselect.min.css" />

<script src="https://cdn.jsdelivr.net/npm/custom-select.js@latest/customselect.min.js"></script>
```

## Simple Usage

```html
<select id="customSelect_single">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <optgroup label="Group 1">
        <option value="3">Option 3</option>
        <option value="4">Option 4</option>
        <option value="5">Option 5</option>
    </optgroup>
</select>
```

```js
import CustomSelect from 'custom-select.js'

new CustomSelect("#customSelect_single");
```

## Configs

```js
/********** HTML **********/
<select id="customSelect" multiple>
    <option value="" data-placeholder="true" selected disabled hidden>Please select</option>
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <optgroup label="Group 1" data-expanded="off">  // data-expanded="true" (default) || "false" || "off"
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
        allowDeselectAll: false,
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
        allowHTML: false,
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
            deselectAll: "cs-deselectAll",
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
            dndHandle: "cs-dndHandle",
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

## Configuration Options

### allowDeselectAll

**Type:** `Boolean` **Default:** `false`

**Usage:** Whether the deselect all button should be shown.

### alwaysOpen

**Type:** `Boolean` **Default:** `false`

**Usage:** Whether the dropdown should always be open.

### closeOnSelect

**Type:** `Boolean` **Default:** `true`

**Usage:** Whether the dropdown should be closed after an option is selected.

### openDirection

**Type:** `String` **Default:** `"auto"` **Options:** `"auto"`, `"up"`, `"down"`

**Usage:** The direction of the dropdown when it is opened.

### openPosition

**Type:** `String` **Default:** `"absolute"` **Options:** `"absolute"`, `"relative"`

**Usage:** The position of the dropdown when it is opened.

### openLocation

**Type:** `HTMLElement` or `String` **Default:** `"body"`

**Usage:** The location of the dropdown when it is opened.

### searchEnable

**Type:** `Boolean` **Default:** `true`

**Usage:** Whether the search input should be shown.

### searchPlaceholder

**Type:** `String` **Default:** `"Search"`

**Usage:** The placeholder of the search input.

### searchNoResult

**Type:** `String` **Default:** `"No result"`

**Usage:** The text to show when there is no result.

### searchMark

**Type:** `Boolean` **Default:** `true`

**Usage:** Whether the search result should be highlighted.

### selectedOptionHidden

**Type:** `Boolean` **Default:** `false`

**Usage:** Whether the selected option should be hidden in the dropdown.

### checkboxMode

**Type:** `Boolean` **Default:** `false`

**Usage:** If true, the options will apply checkbox style.

### sortMode

**Type:** `Boolean` **Default:** `false`

**Usage:** If true, the options will be in sort mode. **Note:** Required to `npm install sortablejs`

### maxValuesShown

**Type:** `Number` **Default:** `20`

**Usage:** The maximum number of values to show in the selected box.

### maxValuesLabel

**Type:** `String` **Default:** `"{count} selected"`

**Usage:** The label to show when the number of selected values is more than `maxValuesShown`. `{count}` will be replaced with the number of selected values.

### allowHTML

**Type:** `Boolean` **Default:** `false`

**Usage:** Whether HTML should be rendered in all elements. If `false`, all elements will be treated as plain text. If `true`, this can be used to perform XSS scripting attacks if you load options from a remote source.

### classNames

**Type:** `Object` **Default:**

```
classNames: {
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
    deselectAll: "cs-deselectAll",
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
    dndHandle: "cs-dndHandle",
}
```

**Usage:** The class names of the elements. E.g. `{ select: "class1 class2 class3" }`

## Events

### beforeOpen

**Usage:** Triggered before the dropdown is opened.

### afterOpen

**Usage:** Triggered after the dropdown is opened.

### beforeClose

**Usage:** Triggered before the dropdown is closed.

### afterClose

**Usage:** Triggered after the dropdown is closed.

### beforeChange

**Usage:** Triggered before the value is changed.

### afterChange

**Usage:** Triggered after the value is changed.

### afterSort

**Usage:** Triggered after the options are sorted.

## Methods

### getSelectedValue()

**Usage:** Get the selected value(s).

### setSelectedValue(value)

**Usage:** Set the selected value(s). If multiple select, value can be array.

### getSelectedObj()

**Usage:** Get the selected option object(s).

### getOptionElBy(key, value)

**Usage:** Get the option element by the key and value.

### getOptionObjBy(key, value)

**Usage:** Get the option object by the key and value.

### getOptions()

**Usage:** Get the options.

### setOptions(options)

**Usage:** Set the options.

### enable()

**Usage:** Enable the dropdown.

### disable()

**Usage:** Disable the dropdown.

### destroy()

**Usage:** Destroy the dropdown.