class CustomSelect {
    constructor(element, { options, settings, events } = {}) {
        if (typeof element !== "string" && !(element instanceof HTMLElement)) {
            console.error("CustomSelect: target element(1st argument) is required.");
            return;
        }

        this.originalSelect = element instanceof HTMLElement ? element : document.querySelector(element);
        if (!this.originalSelect) {
            console.error("CustomSelect: target element not found.");
            return;
        }

        if (this.originalSelect.nodeName !== "SELECT") {
            console.error("CustomSelect: target element must be a select element.");
            return;
        }

        this.options = options || [];
        this.settings = {
            alwaysOpen: false,
            closeOnSelect: true,
            openDirection: "auto", // "auto" (default) || "up" || "down"
            openPosition: "absolute", // "absolute" (default) || "relative"
            openLocation: "body", // HTML element || css selector
            searchEnable: true,
            searchPlaceholder: "Search",
            searchNoResult: "No result",
            searchMark: true,
            selectedOptionHidden: false,
            checkboxMode: false,
            sortMode: false,
            maxValuesShown: 20,
            maxValuesLabel: "{count} selected", // {count} will be replaced with the number of selected values
            allowHTML: false,
            classNames: {},
            ...settings,
        };
        this.events = {
            beforeOpen: () => {},
            afterOpen: () => {},
            beforeClose: () => {},
            afterClose: () => {},
            beforeChange: (newVal, oldVal) => {},
            afterChange: (newVal) => {},
            afterSort: (newOptions) => {},
            ...events,
        };

        this.csId = `cs-${this.#generateId()}`;
        this.csSelect = null;
        this.csLabel = null;
        this.csDropdown = null;
        this.csSearch = null;
        this.csListing = null;
        this.selectedValue = [];
        this.filterOptions = [];
        this.sortedOptions = [];
        this.openLocation = this.settings.openLocation instanceof HTMLElement ? this.settings.openLocation : document.querySelector(this.settings.openLocation);
        this.intervalRejustPosition = null;
        this.isOpen = false;
        this.disabled = false;
        this.isMultipleSelect = this.originalSelect.multiple || false;
        this.listen = false;
        this.observer = new MutationObserver((mutations) => this.#handleObserve(mutations));

        this.classes = {
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
            dndHandle: "cs-dndHandle",
        };

        this.classesForAdd = {};
        Object.entries(this.classes).forEach(([key, value]) => {
            this.classesForAdd[key] = [...value.split(" ")];

            const classNames = this.settings.classNames[key];
            if (classNames) {
                this.classesForAdd[key].push(...classNames.split(" "));
            }
        });

        // this.#appendCSS();
        this.init();
        this.#setListen(true);
    }

    async #appendCSS() {
        const styleId = "cs-css";
        if (document.getElementById(styleId)) return;

        const css = await fetch("https://cdn.jsdelivr.net/gh/harry33321/custom-select/dist/custom-select.min.css")
            .then((response) => response.text())
            .then((data) => {
                return data;
            })
            .catch((error) => {
                console.error(error);
            });

        if (!css) return;

        const style = document.createElement("style");
        style.id = styleId;
        style.innerHTML = css;
        document.head.appendChild(style);
    }

    init() {
        this.originalSelect.style.display = "none";
        this.originalSelect.ariaHidden = true;
        this.originalSelect.addEventListener("change", (e) => {
            if (this.isMultipleSelect) {
                const selectedValue = Array.from(e.target.selectedOptions).map((a) => a.value);
                this.setSelectedValue(selectedValue);
            } else {
                this.setSelectedValue(e.target.value);
            }
        });

        this.options = this.#createOptions(this.options);
        this.filterOptions = this.options;

        this.#renderCSField();
        this.#renderDropdown();
        this.#renderOptions();

        document.addEventListener("click", (e) => this.#handleClickOutside(e));

        this.#rejustPosition();

        if (this.options.length) {
            const defaultSelected = this.getOptions().filter((a) => a.selected);
            const defaultValue = defaultSelected.map((a) => a.value);
            this.setSelectedValue(defaultValue);
        }

        if (this.settings.alwaysOpen) {
            this.#handleOpen();
        }
    }

    #optionObj(option) {
        if (option.options) {
            return {
                id: this.#escapeHTML(option.id) || this.#generateId(),
                label: this.#escapeHTML(option.label),
                options: option.options.map((a) => this.#optionObj(a)),
                groupExpanded: this.#parseDatasetValue(option.groupExpanded, true),
            };
        }

        const isPlaceholder = option instanceof HTMLElement ? option.dataset.placeholder === "true" || false : option.placeholder || false;
        const optionValue = isPlaceholder ? "" : option.value || option.label;

        return {
            id: this.#escapeHTML(option.id) || this.#generateId(),
            label: this.#escapeHTML(option.label),
            value: optionValue,
            placeholder: isPlaceholder,
            selected: option.selected || false,
            disabled: option.disabled || false,
            hidden: option.hidden || false,
            class: option instanceof HTMLElement ? option.className || null : option.class || null,
            style: option instanceof HTMLElement ? option.style.cssText || null : option.style || null,
        };
    }

    #createOptions(optionsData = []) {
        if (optionsData.length) {
            return optionsData.map((option) => this.#optionObj(option));
        } else {
            const optionsArr = [];
            for (const a of this.originalSelect.children) {
                if (a.nodeName === "OPTION") {
                    optionsArr.push(this.#optionObj(a));
                }
                if (a.nodeName === "OPTGROUP") {
                    const groupOptionsArr = [];
                    for (const b of a.children) {
                        groupOptionsArr.push(this.#optionObj(b));
                    }
                    optionsArr.push({
                        id: a.id || this.#generateId(),
                        label: this.#escapeHTML(a.label),
                        options: groupOptionsArr,
                        groupExpanded: this.#parseDatasetValue(a.dataset.expanded, true),
                    });
                }
            }
            return optionsArr;
        }
    }

    #renderCSField() {
        const mainDiv = document.createElement("div");
        mainDiv.role = "combobox";
        mainDiv.ariaHasPopup = "listbox";
        mainDiv.ariaControls = this.csId;
        mainDiv.ariaExpanded = false;
        mainDiv.id = this.csId;
        mainDiv.tabIndex = 0;
        mainDiv.classList.add(...this.classesForAdd.select);
        mainDiv.addEventListener("keydown", (e) => this.#handleKeyDown(e));
        mainDiv.addEventListener("click", () => {
            return this.isOpen ? this.#handleClose() : this.#handleOpen();
        });

        const mainLabel = document.createElement("div");
        mainLabel.classList.add(...this.classesForAdd.label);
        this.csLabel = mainLabel;
        mainDiv.appendChild(this.csLabel);

        const mainArrow = document.createElement("div");
        mainArrow.classList.add(...this.classesForAdd.arrow);
        mainArrow.innerHTML = `<svg viewBox="0 0 20 20"><path d="M2,6 L10,14 L18,6" /></svg>`;
        mainDiv.appendChild(mainArrow);

        this.csSelect = mainDiv;
        this.originalSelect.insertAdjacentElement("afterend", this.csSelect);
    }

    #renderDropdown() {
        const dropdownDiv = document.createElement("div");
        dropdownDiv.role = "listbox";
        dropdownDiv.id = this.csId;
        dropdownDiv.classList.add(...this.classesForAdd.dropdown);
        if (this.settings.openPosition === "relative") {
            dropdownDiv.classList.add(...this.classesForAdd.relative);
        }

        if (this.settings.searchEnable) {
            const searchWrapper = document.createElement("div");
            searchWrapper.classList.add(...this.classesForAdd.searchWrapper);

            const searchInput = document.createElement("input");
            searchInput.type = "search";
            searchInput.placeholder = this.settings.searchPlaceholder;
            searchInput.autocomplete = "off";
            searchInput.autocorrect = "off";
            searchInput.autocapitalize = "off";
            if (!this.settings.alwaysOpen) {
                searchInput.tabIndex = -1;
            }
            searchInput.classList.add(...this.classesForAdd.search);
            searchInput.addEventListener("input", (e) => this.#handleSearch(e));
            searchInput.addEventListener("keydown", (e) => this.#handleKeyDown(e));
            searchInput.addEventListener("blur", () => {
                this.csListing.querySelector(`.${this.classesForAdd.highlighted.join(".")}`)?.classList.remove(...this.classesForAdd.highlighted);
            });

            this.csSearch = searchInput;
            searchWrapper.appendChild(this.csSearch);
            dropdownDiv.appendChild(searchWrapper);
        }

        const listingUl = document.createElement("ul");
        listingUl.classList.add(...this.classesForAdd.listing);
        this.csListing = listingUl;
        dropdownDiv.appendChild(this.csListing);

        this.csDropdown = dropdownDiv;
        this.openLocation.insertAdjacentElement("beforeend", this.csDropdown);
    }

    #renderOptions() {
        this.csListing.innerHTML = "";
        if (this.filterOptions.length) {
            this.filterOptions.forEach((option) => {
                if (option.options) {
                    this.csListing.appendChild(this.#optionGroupTemplate(option));
                } else {
                    this.csListing.appendChild(this.#optionTemplate(option));
                }
            });
        } else {
            const searchNoResult = document.createElement("li");
            searchNoResult.classList.add(...this.classesForAdd.searchNoResult);
            searchNoResult.innerHTML = this.#escapeHTML(this.settings.searchNoResult);
            this.csListing.appendChild(searchNoResult);
        }

        if (this.settings.sortMode) {
            this.#initSorting();
        }
    }

    #optionTemplate(option) {
        const li = document.createElement("li");
        li.role = "option";
        li.ariaSelected = option.selected;
        li.dataset.id = option.id;
        if (option.placeholder) li.dataset.placeholder = option.placeholder;
        if (this.settings.searchMark && this.csSearch && this.csSearch.value) {
            const searchValue = this.csSearch.value.trim();
            li.innerHTML = this.#highlightText(option.label, searchValue, this.classesForAdd.searchMark.join(" "));
        } else {
            li.innerHTML = option.label;
        }
        li.classList.add(...this.classesForAdd.option);
        if (this.settings.checkboxMode) {
            const checkboxDiv = document.createElement("div");
            checkboxDiv.classList.add(...this.classesForAdd.checkbox);
            li.insertAdjacentElement("afterbegin", checkboxDiv);
        }
        if (this.settings.sortMode) {
            li.insertAdjacentElement("afterbegin", this.#dndHandleTemplate());
        }
        if (option.hidden) li.classList.add(...this.classesForAdd.hidden);
        if (option.disabled) {
            li.classList.add(...this.classesForAdd.disabled);
        } else {
            li.addEventListener("click", (e) => this.#handleSelect(e));
        }
        if (option.class) li.className += ` ${option.class}`;
        if (option.style) li.style.cssText = option.style;
        return li;
    }

    #optionGroupTemplate(option) {
        const optionGroup = document.createElement("li");
        optionGroup.role = "group";
        optionGroup.dataset.id = option.id;
        optionGroup.classList.add(...this.classesForAdd.optionGroup);

        const optionGroupLabel = document.createElement("label");
        optionGroupLabel.classList.add(...this.classesForAdd.optionGroupLabel);
        optionGroupLabel.innerHTML = option.label;

        if (this.settings.checkboxMode) {
            const selectAllOfGroupDiv = document.createElement("div");
            selectAllOfGroupDiv.classList.add(...this.classesForAdd.checkbox);

            if (this.isMultipleSelect) {
                selectAllOfGroupDiv.addEventListener("click", (e) => {
                    e.preventDefault();
                    const currentSelectedArr = [...this.selectedValue];
                    let isGroupSelected = true;
                    const options = this.#flattenOptions(option.options);
                    options.forEach((groupOption) => {
                        if (!currentSelectedArr.includes(groupOption.value)) {
                            isGroupSelected = false;
                            currentSelectedArr.push(groupOption.value);
                        }
                    });
                    if (isGroupSelected) {
                        options.forEach((groupOption) => {
                            currentSelectedArr.splice(currentSelectedArr.indexOf(groupOption.value), 1);
                        });
                    }

                    this.setSelectedValue(currentSelectedArr);
                });
            }
            optionGroupLabel.insertAdjacentElement("afterbegin", selectAllOfGroupDiv);
        }

        if (this.settings.sortMode) {
            optionGroupLabel.insertAdjacentElement("afterbegin", this.#dndHandleTemplate());
        }

        if (option.groupExpanded !== "off") {
            const expandIconDiv = document.createElement("div");
            expandIconDiv.classList.add(...this.classesForAdd.arrow);
            expandIconDiv.innerHTML = `
                <input class="${this.classesForAdd.optionGroupExpandInput.join(" ")}" type="checkbox" ${option.groupExpanded ? "checked" : ""} tabindex="-1">
                <svg viewBox="0 0 20 20"><path d="M2,6 L10,14 L18,6" /></svg>
            `;
            optionGroupLabel.appendChild(expandIconDiv);
        }
        optionGroup.appendChild(optionGroupLabel);

        const optionGroupListing = document.createElement("ul");
        optionGroupListing.classList.add(...this.classesForAdd.optionGroupListing);
        option.options.forEach((groupOption) => {
            if (groupOption.options) {
                optionGroupListing.appendChild(this.#optionGroupTemplate(groupOption));
            } else {
                optionGroupListing.appendChild(this.#optionTemplate(groupOption));
            }
        });
        optionGroup.appendChild(optionGroupListing);

        return optionGroup;
    }

    #initSorting() {
        if (typeof require === "undefined") return;
        const Sortable = require("sortablejs").default;

        const nestedSortables = [this.csListing, ...this.csListing.querySelectorAll(`.${this.classesForAdd.optionGroupListing.join(".")}`)];
        for (const sortable of nestedSortables) {
            new Sortable(sortable, {
                group: "nested",
                animation: 300,
                swapThreshold: 0.5,
                handle: `.${this.classesForAdd.dndHandle}`,
                onSort: (e) => {
                    const { oldIndex, newIndex, from, to, target } = e;
                    if (from !== target) return;

                    const sortedOptions = this.sortedOptions.length ? this.sortedOptions : [...this.getOptions(true)];
                    if (from === to) {
                        if (from === this.csListing && to === this.csListing) {
                            const dragOption = sortedOptions.splice(oldIndex, 1)[0];
                            sortedOptions.splice(newIndex, 0, dragOption);
                        } else {
                            const dragOptionGroupId = from.parentElement.dataset.id;
                            const dragOptionGroup = sortedOptions.find((a) => a.id === dragOptionGroupId);
                            const dragOption = dragOptionGroup.options.splice(oldIndex, 1)[0];
                            dragOptionGroup.options.splice(newIndex, 0, dragOption);
                        }
                    } else {
                        if (from === this.csListing) {
                            const dragOption = sortedOptions.splice(oldIndex, 1)[0];
                            const dropOptionGroupId = to.parentElement.dataset.id;
                            const dropOptionGroup = sortedOptions.find((a) => a.id === dropOptionGroupId);
                            dropOptionGroup.options.splice(newIndex, 0, dragOption);
                        } else if (to === this.csListing) {
                            const dragOptionGroupId = from.parentElement.dataset.id;
                            const dragOptionGroup = sortedOptions.find((a) => a.id === dragOptionGroupId);
                            const dragOption = dragOptionGroup.options.splice(oldIndex, 1)[0];
                            sortedOptions.splice(newIndex, 0, dragOption);
                        } else {
                            const dragOptionGroupId = from.parentElement.dataset.id;
                            const dragOptionGroup = sortedOptions.find((a) => a.id === dragOptionGroupId);
                            const dropOptionGroupId = to.parentElement.dataset.id;
                            const dropOptionGroup = sortedOptions.find((a) => a.id === dropOptionGroupId);
                            const dragOption = dragOptionGroup.options.splice(oldIndex, 1)[0];
                            dropOptionGroup.options.splice(newIndex, 0, dragOption);
                        }
                    }

                    this.sortedOptions = sortedOptions;
                    this.events.afterSort(sortedOptions);
                },
            });
        }
    }

    #dndHandleTemplate() {
        const dndHandleDiv = document.createElement("div");
        dndHandleDiv.classList.add(...this.classesForAdd.dndHandle);
        dndHandleDiv.innerHTML = `<svg viewBox="0 -960 960 960"><path d="M360-160q-33 0-56.5-23.5T280-240q0-33 23.5-56.5T360-320q33 0 56.5 23.5T440-240q0 33-23.5 56.5T360-160Zm240 0q-33 0-56.5-23.5T520-240q0-33 23.5-56.5T600-320q33 0 56.5 23.5T680-240q0 33-23.5 56.5T600-160ZM360-400q-33 0-56.5-23.5T280-480q0-33 23.5-56.5T360-560q33 0 56.5 23.5T440-480q0 33-23.5 56.5T360-400Zm240 0q-33 0-56.5-23.5T520-480q0-33 23.5-56.5T600-560q33 0 56.5 23.5T680-480q0 33-23.5 56.5T600-400ZM360-640q-33 0-56.5-23.5T280-720q0-33 23.5-56.5T360-800q33 0 56.5 23.5T440-720q0 33-23.5 56.5T360-640Zm240 0q-33 0-56.5-23.5T520-720q0-33 23.5-56.5T600-800q33 0 56.5 23.5T680-720q0 33-23.5 56.5T600-640Z"/></svg>`;
        return dndHandleDiv;
    }

    #rejustPosition() {
        if (this.settings.openPosition === "relative") return;

        const selectRect = this.csSelect.getBoundingClientRect();
        const openLocationRect = this.openLocation.getBoundingClientRect();

        const offset = {
            top: selectRect.top - openLocationRect.top,
            left: selectRect.left - openLocationRect.left,
        };

        this.openLocation.style.position = "relative";
        this.csDropdown.style.top = `${offset.top + selectRect.height}px`;
        this.csDropdown.style.left = `${offset.left}px`;
        this.csDropdown.style.width = `${selectRect.width}px`;
    }

    #toggleOpen(className) {
        this.#rejustPosition();
        if (this.csSelect.classList.contains(...className) && this.csDropdown.classList.contains(...className)) return;
        this.csSelect.classList.remove(...this.classesForAdd.openUp, ...this.classesForAdd.openDown);
        this.csDropdown.classList.remove(...this.classesForAdd.openUp, ...this.classesForAdd.openDown);
        this.csSelect.classList.add(...className);
        this.csDropdown.classList.add(...className);
    }

    #openUp() {
        this.#toggleOpen(this.classesForAdd.openUp);
        const selectRect = this.csSelect.getBoundingClientRect();
        const dropdownHeight = this.csDropdown.offsetHeight;
        this.csDropdown.style.marginTop = `-${selectRect.height + dropdownHeight}px`;
    }

    #openDown() {
        this.#toggleOpen(this.classesForAdd.openDown);
        this.csDropdown.style.marginTop = `0px`;
    }

    #openAuto() {
        const selectRect = this.csSelect.getBoundingClientRect();
        const dropdownHeight = this.csDropdown.offsetHeight;

        if (window.innerHeight - selectRect.bottom < dropdownHeight) {
            this.#openUp();
        } else {
            this.#openDown();
        }
    }

    #handleOpen() {
        if (this.isOpen || this.disabled) return;

        this.events.beforeOpen();

        this.isOpen = true;
        this.csSelect.ariaExpanded = true;

        if (this.settings.openPosition === "relative") {
            this.#openDown();
        } else {
            if (this.settings.openDirection == "auto") {
                this.#openAuto();
                this.intervalRejustPosition = setInterval(() => this.#openAuto(), 500);
            } else if (this.settings.openDirection == "up") {
                this.#openUp();
                this.intervalRejustPosition = setInterval(() => this.#openUp(), 500);
            } else if (this.settings.openDirection == "down") {
                this.#openDown();
                this.intervalRejustPosition = setInterval(() => this.#openDown(), 500);
            }
        }

        this.#elementInView(this.csListing, this.csListing.querySelector(`.${this.classesForAdd.selected.join(".")}`));

        this.csSearch && this.csSearch.focus();
        this.events.afterOpen();
    }

    #handleClose() {
        if (!this.isOpen || this.settings.alwaysOpen) return;

        if (this.intervalRejustPosition) {
            clearInterval(this.intervalRejustPosition);
            this.intervalRejustPosition = null;
        }

        this.events.beforeClose();
        this.isOpen = false;
        this.csSelect.ariaExpanded = false;
        this.csSelect.classList.remove(...this.classesForAdd.openUp, ...this.classesForAdd.openDown);
        this.csDropdown.classList.remove(...this.classesForAdd.openUp, ...this.classesForAdd.openDown);
        this.csListing.querySelector(`.${this.classesForAdd.highlighted.join(".")}`)?.classList.remove(...this.classesForAdd.highlighted);
        if (this.csSearch && this.csSearch.value) {
            this.csSearch.value = "";
            this.csSearch.dispatchEvent(new Event("input"));
        }
        this.events.afterClose();
    }

    #handleClickOutside(e) {
        if (
            !e.target.closest(`.${this.classesForAdd.select.join(".")}#${this.csId}`) &&
            !e.target.closest(`.${this.classesForAdd.dropdown.join(".")}#${this.csId}`)
        ) {
            this.#handleClose();
        }
    }

    #handleSelect(e) {
        if (e.target.role !== "option") return;

        const selectedId = e.target.dataset.id;
        const selectedValue = this.getOptionObjBy("id", selectedId).value;
        if (this.isMultipleSelect) {
            if (this.selectedValue.includes(selectedValue)) {
                const currentValueArr = this.selectedValue.filter((a) => a !== selectedValue);
                this.setSelectedValue(currentValueArr);
            } else {
                this.setSelectedValue([...this.selectedValue, selectedValue]);
            }
        } else {
            this.setSelectedValue(selectedValue);
        }

        if (this.settings.closeOnSelect) {
            this.#handleClose();
        }
    }

    #handleKeyDown(e) {
        switch (e.key) {
            case "ArrowUp":
            case "ArrowDown":
                e.preventDefault();
                if (!this.isOpen) {
                    this.#handleOpen();
                } else {
                    this.#handleHighlight(e.key);
                }
                break;

            case " ":
            case "Enter":
                if (!this.isOpen) {
                    e.preventDefault();
                    this.#handleOpen();
                } else {
                    const highlighted = this.csListing.querySelector(`.${this.classesForAdd.highlighted.join(".")}`);
                    if (highlighted) {
                        e.preventDefault();
                        highlighted.click();
                    }
                }
                break;

            case "Tab":
            case "Escape":
                this.#handleClose();
                this.csSelect.focus();
                break;
        }
    }

    #handleHighlight(key) {
        const options = this.getOptionsEl(true, true, true);
        const optionsLength = options.length;
        if (optionsLength === 0) return;

        const highlightedOption = this.csListing.querySelector(`.${this.classesForAdd.highlighted.join(".")}`);
        if (highlightedOption) {
            const index = options.indexOf(highlightedOption);

            highlightedOption.classList.remove(...this.classesForAdd.highlighted);
            const nextIndex = key === "ArrowDown" ? (index + 1 < optionsLength ? index + 1 : 0) : index - 1 >= 0 ? index - 1 : optionsLength - 1;
            const nextOption = options[nextIndex];
            nextOption.classList.add(...this.classesForAdd.highlighted);
            this.#elementInView(this.csListing, nextOption);

            const nextParent = nextOption.parentElement;
            if (!nextParent.classList.contains(...this.classesForAdd.optionGroupListing)) return;
            const optgroupLabel = nextParent.previousElementSibling;
            const optgroupExpandInput = optgroupLabel && optgroupLabel.querySelector(`.${this.classesForAdd.optionGroupExpandInput.join(".")}`);
            if (optgroupExpandInput && !optgroupExpandInput.checked) {
                optgroupExpandInput.checked = true;
            }
        } else {
            const selectedOption =
                this.csListing.querySelector(`.${this.classesForAdd.selected.join(".")}:not(.${this.classesForAdd.disabled.join(".")})`) || options[0];
            selectedOption.classList.add(...this.classesForAdd.highlighted);
            this.#elementInView(this.csListing, selectedOption);
        }
    }

    #handleSearch(e) {
        const searchValue = e.target.value;

        const filterDeep = (options) => {
            const filterOptions = [];
            options.forEach((option) => {
                if (option.options) {
                    const options = filterDeep(option.options);
                    if (options.length) {
                        filterOptions.push({ ...option, options: options });
                    }
                } else {
                    const strippedString = this.#stripHTML(option.label);
                    if (strippedString.toLowerCase().includes(searchValue.toLowerCase())) {
                        filterOptions.push(option);
                    }
                }
            });
            return filterOptions;
        };

        this.filterOptions = filterDeep(this.options);

        this.#renderOptions();
        this.setSelectedValue(this.selectedValue);
    }

    #setListen(listen) {
        this.listen = listen;

        if (this.observer) {
            if (listen) {
                this.observer.observe(this.originalSelect, {
                    subtree: true,
                    childList: true,
                    attributes: true,
                });
            }
            if (!listen) {
                this.observer.disconnect();
            }
        }
    }

    #handleObserve(mutations) {
        if (!this.listen) return;

        let classChanged = false;
        let disabledChanged = false;
        let optionChanged = false;

        for (const m of mutations) {
            if (m.target === this.originalSelect) {
                if (m.attributeName === "disabled") {
                    disabledChanged = true;
                }
                if (m.attributeName === "class") {
                    classChanged = true;
                }
                if (m.addedNodes.length > 0 || m.removedNodes.length > 0) {
                    optionChanged = true;
                }
            }
            if (m.target.nodeName === "OPTGROUP" || m.target.nodeName === "OPTION") {
                optionChanged = true;
            }
        }
        if (classChanged) {
            // handle class change
        }
        if (disabledChanged) {
            this.#setListen(false);
            this.originalSelect.disabled ? this.disable() : this.enable();
            this.#setListen(true);
        }
        if (optionChanged) {
            this.#setListen(false);
            this.setOptions();
            this.#setListen(true);
        }
    }

    #originalSelectUnselect() {
        for (const option of this.originalSelect.options) {
            option.selected = false;
        }
    }

    #removeSelectedClass() {
        const selectedOptions = this.csListing.querySelectorAll(`.${this.classesForAdd.selected.join(".")}`);
        selectedOptions.forEach((option) => {
            option.ariaSelected = false;
            option.classList.remove(...this.classesForAdd.selected, ...this.classesForAdd.selectedHidden);
        });
    }

    #addSelectedClass(optionEl) {
        if (optionEl) {
            optionEl.ariaSelected = true;
            optionEl.classList.add(...this.classesForAdd.selected);

            if (this.settings.selectedOptionHidden) {
                optionEl.classList.add(...this.classesForAdd.selectedHidden);
            }

            if (optionEl.dataset.placeholder == "true") {
                this.csLabel.classList.add(...this.classesForAdd.placeholder);
            } else {
                this.csLabel.classList.remove(...this.classesForAdd.placeholder);
            }
        }
    }

    #originalSelectHandleSelect(value) {
        const originalSelectHasSelectedOption = Array.from(this.originalSelect.options).some((option) => {
            if (option.value == value) {
                option.selected = true;
                return true;
            }
        });
        if (!originalSelectHasSelectedOption) {
            this.#setListen(false);
            this.originalSelect.appendChild(new Option(value, value, false, true));
            this.#setListen(true);
        }
    }

    #renderLabelContent() {
        if (this.selectedValue.length > this.settings.maxValuesShown) {
            this.csLabel.innerHTML = this.settings.maxValuesLabel.replace("{count}", this.selectedValue.length);
            return;
        }
        if (this.isMultipleSelect) {
            this.csLabel.innerHTML = this.getSelectedObj()
                .map((a) => this.#multipleSelectedItemTemplate(a))
                .join("");

            const removeBtns = this.csLabel.querySelectorAll(`.${this.classesForAdd.selectedItemRemove.join(".")}`);
            removeBtns.forEach((btn) => {
                btn.addEventListener("click", (e) => {
                    const id = e.target.dataset.id;
                    const value = this.getOptionObjBy("id", id).value;
                    const currentValueArr = [...this.selectedValue];
                    currentValueArr.splice(currentValueArr.indexOf(value), 1);
                    this.setSelectedValue(currentValueArr);
                });
            });
            return;
        }
        // this.csLabel.innerHTML = this.getSelectedObj().map((a) => a.label).join(", ");
        this.csLabel.innerHTML = this.getSelectedObj()[0]?.label ?? "";
    }

    #multipleSelectedItemTemplate(option) {
        return `
            <div class="${this.classesForAdd.selectedItem.join(" ")}">
                <div class="${this.classesForAdd.selectedItemLabel.join(" ")}">${option.label}</div>
                <div class="${this.classesForAdd.selectedItemRemove.join(" ")}" data-id="${option.id}"></div>
            </div>
        `;
    }

    #escapeHTML(html = "") {
        if (this.settings.allowHTML) return html;

        const escapeMap = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
        };
        return html.replace(/[&<>"']/g, (match) => escapeMap[match]);
    }

    #stripHTML(html) {
        return html.replace(/<[^>]+>/gi, "");
    }

    #highlightText(str, search, className) {
        const regex = new RegExp(search, "i");
        const [match] = str.match(regex) || [];
        if (!match) {
            return str;
        }
        const matchStartPosition = str.indexOf(match);
        const matchEndPosition = matchStartPosition + match.length;
        const originalTextFoundByRegex = str.substring(matchStartPosition, matchEndPosition);
        return str.replace(regex, `<mark class="${className}">${originalTextFoundByRegex}</mark>`);
    }

    #generateId(config) {
        const _config = {
            length: 10,
            number: true,
            lowerCase: true,
            upperCase: true,
            special: false,
            // if pattern is set, length will be ignored
            // e.g. { pattern: "xxxx-xxxx-xxxx-xxxx" } will generate "e3f4-5d6g-7h8j-9k0l"
            pattern: "",
            ...config,
        };
        const { length, number, lowerCase, upperCase, special, pattern } = _config;
        const numberArr = "0123456789".split("");
        const lowerCaseArr = "abcdefghijklmnopqrstuvwxyz".split("");
        const upperCaseArr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        const specialArr = "!@#$%^&*()_-+=[]{}\\|;:'\"<>,.?/`~".split("");
        const arr = [];

        if (number) {
            arr.push(...numberArr);
        }
        if (lowerCase) {
            arr.push(...lowerCaseArr);
        }
        if (upperCase) {
            arr.push(...upperCaseArr);
        }
        if (special) {
            arr.push(...specialArr);
        }

        let result = "";
        if (pattern) {
            const patternArr = pattern.split("");
            for (let i = 0; i < patternArr.length; i++) {
                const patternChar = patternArr[i];
                if (patternChar === "x") {
                    const randomIndex = Math.floor(Math.random() * arr.length);
                    result += arr[randomIndex];
                } else {
                    result += patternChar;
                }
            }
        } else {
            for (let i = 0; i < length; i++) {
                const randomIndex = Math.floor(Math.random() * arr.length);
                result += arr[randomIndex];
            }
        }

        return result;
    }

    #elementInView(container, element) {
        if (!element) return;

        const { scrollTop = 0, offsetTop: cTop = 0, clientHeight: cHeight = 0 } = container ?? {};
        const { offsetTop: eTop = 0, clientHeight: eHeight = 0 } = element ?? {};

        const cBottom = cTop + cHeight;
        const eBottom = eTop + eHeight;

        const isOptgroup = element.parentElement.classList.contains(...this.classesForAdd.optionGroupListing);
        const optgroupLabelHeight = isOptgroup ? element.parentElement.previousElementSibling.offsetHeight : 0;

        if (eTop < scrollTop + cTop + optgroupLabelHeight) {
            container.scrollTop = eTop - cTop - optgroupLabelHeight;
        } else if (eBottom > scrollTop + cBottom) {
            container.scrollTop = eBottom - cBottom;
        }
    }

    #parseDatasetValue(value, defaultValue) {
        switch (value) {
            case "true":
                return true;
            case "false":
                return false;
            case undefined:
                return defaultValue || undefined;
            default:
                return value;
        }
    }

    #flattenOptions(options) {
        const flatKey = "options";
        return options.flatMap((item) => (Array.isArray(item[flatKey]) ? this.#flattenOptions(item[flatKey]) : item));
    }

    getSortedOptions() {
        return this.sortedOptions.length ? this.sortedOptions : [...this.getOptions(true)];
    }

    getOptionsEl(notPlaceholder = false, notDisabled = false, notHidden = false) {
        let query = `.${this.classesForAdd.option.join(".")}`;
        if (notPlaceholder) {
            query += `:not(.${this.classesForAdd.placeholder.join(".")})`;
        }
        if (notDisabled) {
            query += `:not(.${this.classesForAdd.disabled.join(".")})`;
        }
        if (notHidden) {
            query += `:not(.${this.classesForAdd.hidden.join(".")})`;
        }
        return Array.from(this.csListing.querySelectorAll(query));
    }

    getOptionElBy(key, value) {
        const optionId = this.getOptionObjBy(key, value).id;
        const optionEl = this.csListing.querySelector(`li[data-id='${optionId}']`);
        return optionEl;
    }

    getOptionObjBy(key, value) {
        const option = this.getOptions().find((data) => data[key] === value) ?? {};
        return { ...option };
    }

    getSelectedObj() {
        const selectedValue = this.selectedValue;
        const selectedOptions = selectedValue.map((value) => this.getOptionObjBy("value", value));
        return [...selectedOptions];
    }

    getSelectedValue() {
        const selectedValue = this.selectedValue;
        return this.isMultipleSelect ? selectedValue : selectedValue[0];
    }

    setSelectedValue(value = "", runChange = true) {
        if (runChange && this.events.beforeChange(value, this.getSelectedValue(), this) === false) return;

        this.#originalSelectUnselect();
        this.#removeSelectedClass();

        this.selectedValue = Array.isArray(value) ? value : [value];
        this.selectedValue.forEach((value) => {
            const selectedOption = this.getOptionElBy("value", value);
            this.#addSelectedClass(selectedOption);
            this.#originalSelectHandleSelect(value);
        });

        this.#renderLabelContent();

        runChange && this.events.afterChange(this.getSelectedValue(), this);
    }

    getOptions(withGroup = false) {
        return withGroup ? this.options : this.#flattenOptions(this.options);
    }

    setOptions(options) {
        this.options = this.#createOptions(options);
        this.filterOptions = this.options;
        this.#renderOptions();
    }

    enable() {
        this.disabled = false;
        this.originalSelect.disabled = false;
        this.csSelect.classList.remove(...this.classesForAdd.disabled);
    }

    disable() {
        this.disabled = true;
        this.originalSelect.disabled = true;
        this.csSelect.classList.add(...this.classesForAdd.disabled);
    }

    destroy() {
        document.removeEventListener("click", (e) => this.#handleClickOutside(e));
        this.csSelect.remove();
        this.csDropdown.remove();
        this.originalSelect.style.display = "";
    }
}

if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = CustomSelect;
} else {
    window.CustomSelect = CustomSelect;
}

/***** Usage Example ******/
/********** HTML **********/
/* 
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
*/

/*********** js ***********/
/* 
const customSelect = new CustomSelect("#customSelect", {
    options: [                          // if options is empty, it will get options from HTML select element
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
*/
