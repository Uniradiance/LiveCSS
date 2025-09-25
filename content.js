
(function() {
    'use strict';

    // Generate a unique storage key for the current website's hostname.
    const hostStorageKey = 'cssConfigs_' + window.location.hostname;
    // This will hold all configurations for the current host.
    let allHostData = [];
    // This will hold the specific configuration that matches the current page path.
    let pageData = null;
    // A direct reference to the configs of the active pageData object.
    let currentConfigs = [];


    // Create a <style> tag to inject pseudo-element CSS rules into the <head>.
    const styleElement = document.createElement('style');
    document.head.appendChild(styleElement);

    // SVG Icons for the new UI
    const icons = {
        delete: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>`,
        add: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
        chevronDown: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`,
        close: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    };
    
    // Converts a glob-like pattern to a RegExp.
    function patternToRegex(pattern) {
        if (!pattern) return null;
        // Escape special regex characters, then replace wildcard '*' with '.*'
        const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regexString = '^' + escaped.replace(/\\\*/g, '.*') + '$';
        return new RegExp(regexString);
    }

    // Finds the most specific matching config from an array of configs.
    function findBestMatch(allConfigs, path) {
        if (!allConfigs || allConfigs.length === 0) {
            return null;
        }

        const matches = allConfigs.filter(config => {
            const regex = patternToRegex(config.matchPattern);
            return regex && regex.test(path);
        });

        if (matches.length === 0) {
            return null;
        }

        // Return the one with the longest (most specific) pattern
        matches.sort((a, b) => b.matchPattern.length - a.matchPattern.length);
        return matches[0];
    }


    // Generates and sets CSS rules for pseudo-elements (e.g., :hover, :before).
    function applyPseudoStyles(configs) {
        const cssRules = configs.flatMap(config => {
            if (!config.pseudoStyles) return [];
            return Object.entries(config.pseudoStyles).map(([pseudo, styles]) => {
                const styleString = Object.entries(styles)
                    .map(([property, value]) => `${property}: ${value};`)
                    .join(' ');
                return `${config.selector}${pseudo} { ${styleString} }`;
            });
        });
        styleElement.innerHTML = cssRules.join('\n');
    }

    // Applies inline styles directly to DOM elements.
    function applyStylesToDom(configs) {
        configs.forEach(config => {
            if (!config.selector || config.selector.trim() === '') {
                return; // Skip configs with empty selectors.
            }
            try {
                const allElements = document.querySelectorAll(config.selector);

                const elementIndex = parseInt(config.elementIndex, 10);
                const useSpecificIndex = !isNaN(elementIndex) && elementIndex >= 0;

                if (useSpecificIndex) {
                    const specificElement = allElements[elementIndex];
                    if (specificElement) {
                        if (config.isReplace) {
                            specificElement.innerHTML = '';
                        }
                        Object.entries(config.styles).forEach(([property, value]) => {
                            specificElement.style[property] = value;
                        });
                    }
                } else {
                    allElements.forEach(element => {
                        if (config.isReplace) {
                            element.innerHTML = '';
                        }
                        Object.entries(config.styles).forEach(([property, value]) => {
                            element.style[property] = value;
                        });
                    });
                }
            } catch (e) {
                console.warn(`CSS Style Editor: Invalid selector "${config.selector}"`, e);
            }
        });
    }

    // Sends the global script to the background service worker for execution.
    function applyScripts() {
        if (pageData && pageData.globalScript && pageData.globalScript.enabled && pageData.globalScript.code) {
            chrome.runtime.sendMessage({
                action: "execute_script",
                script: pageData.globalScript.code
            });
        }
    }

    // Function to apply only visual styles (CSS and pseudo-elements).
    function applyVisualStyles() {
        if (!pageData) {
             // If there's no matching config, clear any injected pseudo-styles
             // from a previous page navigation on the same domain.
             styleElement.innerHTML = '';
             return;
        }
        applyPseudoStyles(pageData.configs);
        applyStylesToDom(pageData.configs);
    }

    // A single function to apply all types of changes, including scripts.
    function applyAllChanges() {
        applyVisualStyles();
        applyScripts();
    }

    // Save configurations and only apply visual style changes.
    function saveAndApplyStyles() {
        chrome.storage.local.set({ [hostStorageKey]: allHostData });
        applyVisualStyles();
    }

    // Save configurations and apply all changes (styles and scripts).
    function saveAndApplyAll() {
        chrome.storage.local.set({ [hostStorageKey]: allHostData });
        applyAllChanges();
    }

    // Helper function to create a list-based editor for CSS properties and values.
    function createStyleEditor(stylesObject, onUpdate) {
        const container = document.createElement('div');
        container.className = 'styles-editor';

        const stylesList = document.createElement('div');
        stylesList.className = 'styles-list-container';

        const rerender = () => {
            stylesList.innerHTML = '';
            const safeStylesObject = stylesObject || {};

            Object.entries(safeStylesObject).forEach(([key, value]) => {
                const styleRow = document.createElement('div');
                styleRow.className = 'style-row';

                const keyInput = document.createElement('input');
                keyInput.type = 'text';
                keyInput.value = key;
                keyInput.placeholder = 'property';
                keyInput.dataset.key = key;

                const valueInput = document.createElement('input');
                valueInput.type = 'text';
                valueInput.value = value;
                valueInput.placeholder = 'value';

                const update = () => {
                    const oldKey = keyInput.dataset.key;
                    const newKey = keyInput.value.trim();
                    const newValue = valueInput.value;

                    if (!newKey) {
                        delete safeStylesObject[oldKey];
                    } else if (newKey !== oldKey) {
                        delete safeStylesObject[oldKey];
                        safeStylesObject[newKey] = newValue;
                        keyInput.dataset.key = newKey;
                    } else {
                        safeStylesObject[newKey] = newValue;
                    }
                    onUpdate();
                };
                keyInput.addEventListener('change', update);
                valueInput.addEventListener('change', update);

                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = icons.delete;
                deleteBtn.className = 'btn-icon btn-delete-style';
                deleteBtn.title = 'Delete this style';
                deleteBtn.addEventListener('click', () => {
                    delete safeStylesObject[key];
                    onUpdate();
                    rerender();
                });

                styleRow.append(keyInput, valueInput, deleteBtn);
                stylesList.appendChild(styleRow);
            });
        };

        const addButton = document.createElement('button');
        addButton.innerHTML = `${icons.add} Add Property`;
        addButton.className = 'btn-add-style';
        addButton.addEventListener('click', () => {
            let newProp = 'property';
            let count = 1;
            while ((stylesObject || {})[newProp]) {
                newProp = `property-${count++}`;
            }
            stylesObject[newProp] = 'value';
            onUpdate();
            rerender();
        });

        rerender();
        container.append(stylesList, addButton);

        return { element: container, rerender };
    }

    // Creates the main configuration panel UI.
    function createConfigPanel() {
        const panel = document.createElement('div');
        panel.id = 'tm-css-config-panel';
        panel.classList.add('hidden'); // Hidden by default.

        const header = document.createElement('div');
        header.className = 'panel-header';
        
        const title = document.createElement('h3');
        title.textContent = `Live CSS & JS Editor`;
        
        const closeButton = document.createElement('button');
        closeButton.className = 'btn-icon btn-close-panel';
        closeButton.innerHTML = icons.close;
        closeButton.title = 'Hide Panel';
        closeButton.onclick = () => panel.classList.add('hidden');

        header.append(title, closeButton);
        panel.appendChild(header);
        
        // --- NEW Match Pattern Editor ---
        const patternContainer = document.createElement('div');
        patternContainer.className = 'match-pattern-container';

        const hostnameLabel = document.createElement('span');
        hostnameLabel.className = 'hostname-label';
        hostnameLabel.textContent = window.location.hostname;

        const patternInput = document.createElement('input');
        patternInput.type = 'text';
        patternInput.id = 'match-pattern-input';
        patternInput.placeholder = 'e.g., /path/* or *';
        patternInput.title = 'URL Path Match Pattern. Use * as a wildcard.';
        
        patternContainer.append(hostnameLabel, patternInput);
        panel.appendChild(patternContainer);


        const configsContainer = document.createElement('div');
        configsContainer.id = 'tm-css-configs-container';
        panel.appendChild(configsContainer);

        function renderConfigs() {
            configsContainer.innerHTML = '';
            if (!pageData) return; // Don't render if no config is active

            currentConfigs.forEach((config, index) => {
                const item = document.createElement('div');
                item.className = 'config-item';
                if (config.isCollapsed) {
                    item.classList.add('collapsed');
                }

                // --- Item Header ---
                const itemHeader = document.createElement('div');
                itemHeader.className = 'config-item-header';
                itemHeader.onclick = (e) => {
                    // Don't collapse if clicking on an input, button, or label
                    if (e.target.closest('input, button, .toggle-switch, textarea')) return;
                    config.isCollapsed = !config.isCollapsed;
                    item.classList.toggle('collapsed');
                };

                const chevron = document.createElement('span');
                chevron.className = 'chevron';
                chevron.innerHTML = icons.chevronDown;

                const selectorInput = document.createElement('input');
                selectorInput.type = 'text';
                selectorInput.value = config.selector || '';
                selectorInput.placeholder = 'e.g., .my-class, #my-id';
                selectorInput.className = 'selector-input';
                selectorInput.addEventListener('change', (e) => {
                    currentConfigs[index].selector = e.target.value;
                    saveAndApplyStyles();
                });
                
                // --- Header Controls ---
                const headerControls = document.createElement('div');
                headerControls.className = 'config-item-header-controls';

                // --- isReplace Toggle ---
                const isReplaceLabel = document.createElement('label');
                isReplaceLabel.className = 'toggle-switch';
                isReplaceLabel.title = 'Clear element content';
                const isReplaceCheckbox = document.createElement('input');
                isReplaceCheckbox.type = 'checkbox';
                isReplaceCheckbox.checked = config.isReplace || false;
                isReplaceCheckbox.addEventListener('change', (e) => {
                    currentConfigs[index].isReplace = e.target.checked;
                    saveAndApplyStyles();
                });
                const isReplaceSlider = document.createElement('span');
                isReplaceSlider.className = 'slider';
                isReplaceLabel.append(isReplaceCheckbox, isReplaceSlider);
                headerControls.appendChild(isReplaceLabel);
                
                // --- Element Index Input ---
                const indexInput = document.createElement('input');
                indexInput.type = 'number';
                indexInput.value = config.elementIndex ?? '';
                indexInput.placeholder = '#';
                indexInput.title = 'Element Index (0-based)';
                indexInput.min = '0';
                indexInput.className = 'element-index-input';
                indexInput.addEventListener('input', (e) => {
                    currentConfigs[index].elementIndex = e.target.value;
                    saveAndApplyStyles();
                });
                headerControls.appendChild(indexInput);

                // --- Delete Button ---
                const deleteButton = document.createElement('button');
                deleteButton.innerHTML = icons.delete;
                deleteButton.className = 'btn-icon btn-delete';
                deleteButton.title = 'Delete this configuration';
                deleteButton.addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this config item?')) {
                        currentConfigs.splice(index, 1);
                        saveAndApplyAll();
                        renderConfigs(); // Re-render list
                    }
                });
                headerControls.appendChild(deleteButton);
                itemHeader.append(chevron, selectorInput, headerControls);

                // --- Item Body (Collapsible) ---
                const itemBody = document.createElement('div');
                itemBody.className = 'config-item-body';

                // --- Styles Editor ---
                const stylesLabel = document.createElement('label');
                stylesLabel.textContent = 'Styles:';
                itemBody.appendChild(stylesLabel);
                if (typeof currentConfigs[index].styles === 'undefined') {
                    currentConfigs[index].styles = {};
                }
                const stylesEditor = createStyleEditor(currentConfigs[index].styles, saveAndApplyStyles);
                itemBody.appendChild(stylesEditor.element);

                // --- Pseudo Styles Editor ---
                const pseudoStylesLabel = document.createElement('label');
                pseudoStylesLabel.textContent = 'Pseudo-class Styles:';
                const pseudoStylesContainer = document.createElement('div');
                pseudoStylesContainer.className = 'pseudo-styles-container';
                itemBody.append(pseudoStylesLabel, pseudoStylesContainer);

                function renderPseudoStyles() {
                    pseudoStylesContainer.innerHTML = '';
                    const pseudoStylesObject = currentConfigs[index].pseudoStyles || {};

                    Object.entries(pseudoStylesObject).forEach(([pseudoSelector, styles]) => {
                        const pseudoBlock = document.createElement('div');
                        pseudoBlock.className = 'pseudo-style-block';

                        const pseudoHeader = document.createElement('div');
                        pseudoHeader.className = 'pseudo-style-header';
                        const pseudoSelectorInput = document.createElement('input');
                        pseudoSelectorInput.type = 'text';
                        pseudoSelectorInput.value = pseudoSelector;
                        pseudoSelectorInput.dataset.key = pseudoSelector;
                        pseudoSelectorInput.placeholder = 'e.g., :hover';
                        pseudoSelectorInput.addEventListener('change', (e) => {
                            const oldSelector = pseudoSelectorInput.dataset.key;
                            const newSelector = e.target.value.trim();
                            if (!newSelector) {
                                delete pseudoStylesObject[oldSelector];
                            } else if (newSelector !== oldSelector) {
                                pseudoStylesObject[newSelector] = pseudoStylesObject[oldSelector];
                                delete pseudoStylesObject[oldSelector];
                                pseudoSelectorInput.dataset.key = newSelector;
                            }
                            saveAndApplyStyles();
                            renderPseudoStyles(); // Re-render to reflect changes
                        });

                        const deletePseudoBlockBtn = document.createElement('button');
                        deletePseudoBlockBtn.innerHTML = icons.delete;
                        deletePseudoBlockBtn.className = 'btn-icon btn-delete';
                        deletePseudoBlockBtn.title = 'Delete pseudo-class block';
                        deletePseudoBlockBtn.addEventListener('click', () => {
                            delete pseudoStylesObject[pseudoSelector];
                            saveAndApplyStyles();
                            renderPseudoStyles();
                        });

                        pseudoHeader.append(pseudoSelectorInput, deletePseudoBlockBtn);
                        const innerStylesEditor = createStyleEditor(styles, saveAndApplyStyles);
                        pseudoBlock.append(pseudoHeader, innerStylesEditor.element);
                        pseudoStylesContainer.appendChild(pseudoBlock);
                    });

                    const addPseudoBlockBtn = document.createElement('button');
                    addPseudoBlockBtn.innerHTML = `${icons.add} Add Pseudo-class`;
                    addPseudoBlockBtn.className = 'btn-add-pseudo';
                    addPseudoBlockBtn.addEventListener('click', () => {
                        if (!currentConfigs[index].pseudoStyles) {
                            currentConfigs[index].pseudoStyles = {};
                        }
                        let newSelector = ':new-pseudo';
                        let count = 1;
                        while(currentConfigs[index].pseudoStyles[newSelector]) {
                            newSelector = `:new-pseudo-${count++}`;
                        }
                        currentConfigs[index].pseudoStyles[newSelector] = { 'property': 'value' };
                        saveAndApplyStyles();
                        renderPseudoStyles();
                    });
                    pseudoStylesContainer.appendChild(addPseudoBlockBtn);
                }
                renderPseudoStyles();
                
                item.append(itemHeader, itemBody);
                configsContainer.appendChild(item);
            });
        }

        // --- Global JavaScript Editor ---
        const globalJsContainer = document.createElement('div');
        globalJsContainer.className = 'global-js-container collapsed'; // Collapsed by default

        const jsLabel = document.createElement('div');
        jsLabel.className = 'js-editor-label';
        jsLabel.onclick = (e) => {
            // Prevent toggling when clicking the enable/disable switch
            if (e.target.closest('.toggle-switch')) return;
            globalJsContainer.classList.toggle('collapsed');
        };

        const chevron = document.createElement('span');
        chevron.className = 'chevron';
        chevron.innerHTML = icons.chevronDown;
        
        const jsLabelText = document.createElement('span');
        jsLabelText.textContent = 'Global JavaScript';
        
        const jsLabelLeft = document.createElement('div');
        jsLabelLeft.className = 'js-label-left';
        jsLabelLeft.append(chevron, jsLabelText);

        const scriptEnabledLabel = document.createElement('label');
        scriptEnabledLabel.className = 'toggle-switch';
        scriptEnabledLabel.title = 'Enable/Disable the global script';
        const scriptEnabledCheckbox = document.createElement('input');
        scriptEnabledCheckbox.type = 'checkbox';
        
        const scriptEnabledSlider = document.createElement('span');
        scriptEnabledSlider.className = 'slider';
        scriptEnabledLabel.append(scriptEnabledCheckbox, scriptEnabledSlider);

        jsLabel.append(jsLabelLeft, scriptEnabledLabel);
        globalJsContainer.appendChild(jsLabel);

        const jsEditorBody = document.createElement('div');
        jsEditorBody.className = 'js-editor-body';

        const jsTextarea = document.createElement('textarea');
        jsTextarea.className = 'js-editor-textarea';
        jsTextarea.placeholder = `// Your custom JS code here...\n// This script will run in the page's context.`;
        
        jsEditorBody.appendChild(jsTextarea);
        globalJsContainer.appendChild(jsEditorBody);
        panel.appendChild(globalJsContainer);
        
        // --- Centralized UI Update Function ---
        function updatePanelUI() {
            patternInput.value = pageData ? pageData.matchPattern : (window.location.pathname || '/');
            jsTextarea.value = pageData?.globalScript?.code || '';
            scriptEnabledCheckbox.checked = pageData ? (pageData.globalScript.enabled !== false) : true;
            renderConfigs();
        }
        updatePanelUI(); // Initial UI state setup

        // --- Logic for creating a new configuration if none exists ---
        function ensurePageDataExists() {
            if (pageData) return true;

            const newPattern = patternInput.value.trim() || '*';
            const existing = allHostData.find(p => p.matchPattern === newPattern);
            if (existing) {
                alert("Cannot create new configuration: a pattern matching '" + newPattern + "' already exists.");
                return false;
            }
            pageData = {
                matchPattern: newPattern,
                configs: [],
                globalScript: { code: '', enabled: true }
            };
            allHostData.push(pageData);
            currentConfigs = pageData.configs;
            patternInput.value = newPattern;
            return true;
        }

        // --- Event Listeners for UI elements ---
        patternInput.addEventListener('change', (e) => {
            if (!pageData) return; // Do nothing if no config is loaded

            const newPattern = e.target.value.trim();
            if (!newPattern) {
                alert("Match pattern cannot be empty.");
                e.target.value = pageData.matchPattern; // revert
                return;
            }

            const existing = allHostData.find(p => p.matchPattern === newPattern);
            if (existing && existing !== pageData) {
                alert("A configuration with this pattern already exists.");
                e.target.value = pageData.matchPattern; // revert
                return;
            }

            pageData.matchPattern = newPattern;
            saveAndApplyAll();
        });
        
        jsTextarea.addEventListener('change', (e) => {
            if (!ensurePageDataExists()) {
                e.target.value = pageData?.globalScript?.code || ''; // Revert if creation failed
                return;
            }
            pageData.globalScript.code = e.target.value;
            saveAndApplyAll();
        });

        scriptEnabledCheckbox.addEventListener('change', (e) => {
            if (!ensurePageDataExists()) return;
            pageData.globalScript.enabled = e.target.checked;
            saveAndApplyAll();
        });


        const actions = document.createElement('div');
        actions.className = 'panel-actions';

        const addButton = document.createElement('button');
        addButton.textContent = 'Add New Rule';
        addButton.className = 'btn-primary';
        addButton.addEventListener('click', () => {
            if (!ensurePageDataExists()) return;
            
            currentConfigs.push({
                selector: '',
                styles: {},
                isReplace: false,
                isCollapsed: false
            });
            saveAndApplyStyles();
            renderConfigs();
        });

        // --- Import/Export/Clear ---
        const secondaryActions = document.createElement('div');
        secondaryActions.className = 'secondary-actions';
        
        const exportButton = document.createElement('button');
        exportButton.textContent = 'Export';
        exportButton.className = 'btn-secondary';
        exportButton.title = 'Export all configurations for this domain as a JSON file.';
        exportButton.addEventListener('click', () => {
            if (!allHostData || allHostData.length === 0) {
                alert('There is no configuration to export.');
                return;
            }
            try {
                const dataToExport = allHostData.filter(p => p.configs.length > 0 || (p.globalScript && p.globalScript.code));
                if (dataToExport.length === 0) {
                     alert('There is no configuration to export.');
                     return;
                }
                const jsonString = JSON.stringify(dataToExport, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `css-config-${window.location.hostname}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Failed to export configuration:', error);
                alert('An error occurred while exporting the configuration.');
            }
        });

        const importLabel = document.createElement('label');
        importLabel.textContent = 'Import';
        importLabel.className = 'btn-secondary btn-import-label';
        importLabel.title = 'Import configurations from a JSON file. This will overwrite all current settings for this domain.';

        const importInput = document.createElement('input');
        importInput.type = 'file';
        importInput.accept = '.json,application/json';
        importInput.style.display = 'none';
        importInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;
            if (!confirm('Importing will overwrite all current settings for this site. Continue?')) {
                event.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (!Array.isArray(importedData) || (importedData.length > 0 && typeof importedData[0].matchPattern === 'undefined')) {
                        throw new Error('Imported file is not in the correct format (must be an array of configurations with match patterns).');
                    }
                    allHostData = importedData;
                    
                    pageData = findBestMatch(allHostData, window.location.pathname);
                    currentConfigs = pageData ? pageData.configs : [];
                    
                    saveAndApplyAll();
                    updatePanelUI();

                    alert('Configuration imported successfully!');
                } catch (error) {
                    console.error('Failed to import configuration:', error);
                    alert(`Failed to import configuration: ${error.message}`);
                } finally {
                     event.target.value = '';
                }
            };
            reader.onerror = () => {
                alert('An error occurred while reading the file.');
                 event.target.value = '';
            };
            reader.readAsText(file);
        });
        importLabel.appendChild(importInput);

        const resetButton = document.createElement('button');
        resetButton.textContent = 'Clear All';
        resetButton.className = 'btn-secondary btn-reset';
        resetButton.addEventListener('click', () => {
            if (confirm(`Are you sure you want to clear ALL configurations for ${window.location.hostname}?`)) {
                allHostData = [];
                pageData = null;
                currentConfigs = [];
                saveAndApplyAll(); // Will save empty array and re-apply (clearing styles)
                updatePanelUI();
            }
        });

        secondaryActions.append(exportButton, importLabel, resetButton);
        actions.append(addButton, secondaryActions);
        panel.appendChild(actions);
        document.body.appendChild(panel);

        // --- Make Panel Draggable ---
        let isDragging = false;
        let offset = { x: 0, y: 0 };
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return; // Don't drag if clicking close button
            isDragging = true;
            const rect = panel.getBoundingClientRect();
            offset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            header.style.cursor = 'grabbing';
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            panel.style.left = (e.clientX - offset.x) + 'px';
            panel.style.top = (e.clientY - offset.y) + 'px';
        });
        document.addEventListener('mouseup', () => {
            isDragging = false;
            header.style.cursor = 'grab';
        });

        return panel;
    }

    // Main initialization logic.
    function initialize() {
        applyAllChanges();

        // Observe DOM changes to re-apply styles dynamically, but not scripts.
        const observer = new MutationObserver(applyVisualStyles);
        observer.observe(document.body, { childList: true, subtree: true });

        // Create the UI elements.
        createConfigPanel();
    }

    // Load configs from storage, then initialize the editor.
    chrome.storage.local.get([hostStorageKey], (result) => {
        const storedData = result[hostStorageKey];

        if (storedData) {
            // Check if it's the new format (array of objects with matchPattern)
            if (Array.isArray(storedData) && (storedData.length === 0 || 'matchPattern' in storedData[0])) {
                allHostData = storedData;
            } else {
                // Old format found, migrate to new structure
                const migratedConfig = {
                    matchPattern: '*',
                    configs: [],
                    globalScript: { code: '', enabled: true }
                };
                if (Array.isArray(storedData)) { // Oldest format, just an array of configs
                    migratedConfig.configs = storedData;
                } else if (typeof storedData === 'object' && storedData !== null) { // Old format with configs and globalScript
                    migratedConfig.configs = storedData.configs || [];
                    migratedConfig.globalScript = storedData.globalScript || { code: '', enabled: true };
                }
                allHostData = [migratedConfig];
            }
        } else {
            allHostData = [];
        }

        pageData = findBestMatch(allHostData, window.location.pathname);
        currentConfigs = pageData ? pageData.configs : [];
        
        initialize();
    });

    // Listen for messages from the background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "toggle_panel") {
            const panel = document.getElementById('tm-css-config-panel');
            if (panel) {
                panel.classList.toggle('hidden');
            }
        }
    });

})();
