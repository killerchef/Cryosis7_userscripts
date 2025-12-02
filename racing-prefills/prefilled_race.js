// ==UserScript==
// @name         Torn Custom Race Presets
// @namespace    https://greasyfork.org/en/scripts/393632-torn-custom-race-presets
// @version      0.4.0
// @description  Save, load, and manage custom race presets with UI
// @author       Cryosis7 [926640] - Extended by UnAmigo
// @match        www.torn.com/page.php?sid=racing*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = 'torn_race_presets';

    // Default presets if none exist
    const defaultPresets = [
        {
            name: "Quick Industrial",
            minDrivers: 2,
            maxDrivers: 2,
            trackName: "Industrial",
            numberOfLaps: 1,
            carsAllowed: "Any Class",
            upgradesAllowed: true,
            betAmount: 0,
            waitTime: "ASAP",
            password: "",
        },
        {
            name: "Stock A-Class Race",
            minDrivers: 4,
            maxDrivers: 10,
            trackName: "Speedway",
            numberOfLaps: 5,
            carsAllowed: "A Class only",
            upgradesAllowed: false,
            betAmount: 100000,
            waitTime: "ASAP",
            password: "",
        },
    ];

    // Load presets from localStorage
    function loadPresets() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                return Array.isArray(parsed) ? parsed : defaultPresets;
            }
        } catch (e) {
            console.error('Error loading presets:', e);
        }
        return defaultPresets;
    }

    // Save presets to localStorage
    function savePresets(presets) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
            return true;
        } catch (e) {
            console.error('Error saving presets:', e);
            return false;
        }
    }

    // Get current form values
    function getCurrentFormValues() {
        const preset = {};

        const name = $('.race-wrap div.input-wrap input').val();
        if (name) preset.name = name;

        const minDrivers = $('.drivers-wrap div.input-wrap input').val();
        if (minDrivers) preset.minDrivers = parseInt(minDrivers);

        const maxDrivers = $('.drivers-max-wrap div.input-wrap input').val();
        if (maxDrivers) preset.maxDrivers = parseInt(maxDrivers);

        const laps = $('.laps-wrap > .input-wrap > input').val();
        if (laps) preset.numberOfLaps = parseInt(laps);

        const bet = $('.bet-wrap > .input-wrap input[name="betAmount"]').val();
        if (bet) preset.betAmount = parseInt(bet.replace(/,/g, '')) || 0;

        const password = $('.password-wrap > .input-wrap > input').val();
        if (password) preset.password = password;

        // Get selected track
        const trackText = $('#select-racing-track-button .ui-selectmenu-status').text();
        if (trackText) preset.trackName = trackText;

        // Get selected cars
        const carsText = $('#select-racing-cars-button .ui-selectmenu-status').text();
        if (carsText) preset.carsAllowed = carsText;

        // Get upgrades allowed
        const upgradesText = $('#select-allow-upgrades-button .ui-selectmenu-status').text();
        if (upgradesText) preset.upgradesAllowed = upgradesText === "Allow upgrades";

        // Get wait time
        const waitText = $('#wait-time-button .ui-selectmenu-status').text();
        if (waitText) preset.waitTime = waitText;

        return preset;
    }

    // Fill form with preset values
    function fillPreset(preset) {
        if ("name" in preset) $('.race-wrap div.input-wrap input').val(preset.name);
        if ("minDrivers" in preset) $('.drivers-wrap div.input-wrap input').val(preset.minDrivers);
        if ("maxDrivers" in preset) $('.drivers-max-wrap div.input-wrap input').val(preset.maxDrivers);
        if ("numberOfLaps" in preset) $('.laps-wrap > .input-wrap > input').val(preset.numberOfLaps);
        if ("betAmount" in preset) $('.bet-wrap > .input-wrap input[name="betAmount"]').val(preset.betAmount);
        if ("password" in preset) $('.password-wrap > .input-wrap > input').val(preset.password);

        if ("trackName" in preset) {
            $('#select-racing-track').selectmenu();
            let trackItem = $('#select-racing-track-menu > li > a').filter(function() {
                return $(this).text().trim() === preset.trackName;
            }).first();
            if (trackItem.length > 0) trackItem.mouseup();
        }

        if ("carsAllowed" in preset) {
            $('#select-racing-cars').selectmenu();
            let carsItem = $('#select-racing-cars-menu > li > a').filter(function() {
                return $(this).text().trim() === preset.carsAllowed;
            }).first();
            if (carsItem.length > 0) carsItem.mouseup();
        }

        if ("upgradesAllowed" in preset) {
            $('#select-allow-upgrades').selectmenu();
            const upgradesString = preset.upgradesAllowed ? "Allow upgrades" : "Stock cars only";
            let upgradesItem = $('#select-allow-upgrades-menu > li > a').filter(function() {
                return $(this).text().trim() === upgradesString;
            }).first();
            if (upgradesItem.length > 0) upgradesItem.mouseup();
        }

        if ("waitTime" in preset) {
            $('#wait-time').selectmenu();
            let waitItem = $('#wait-time-menu > li > a').filter(function() {
                return $(this).text().trim() === preset.waitTime;
            }).first();
            if (waitItem.length > 0) waitItem.mouseup();
        }
    }

    // Draw the preset UI
    function drawPresetBar() {
        // Remove existing bar if present
        $('#race-preset-manager').remove();

        const presets = loadPresets();

        let presetHTML = `
        <div id="race-preset-manager" class="filter-container m-top10">
            <div class="title-gray top-round" style="display: flex; justify-content: space-between; align-items: center;">
                <span>Race Presets</span>
                <div style="display: flex; gap: 10px;">
                    <button id="save-new-preset-btn" class="torn-btn" style="padding: 3px 10px; font-size: 11px;">💾 Save Current</button>
                    <button id="import-presets-btn" class="torn-btn" style="padding: 3px 10px; font-size: 11px;">📥 Import</button>
                    <button id="export-presets-btn" class="torn-btn" style="padding: 3px 10px; font-size: 11px;">📤 Export</button>
                </div>
            </div>

            <div class="cont-gray p10 bottom-round">
                <div id="preset-buttons-container" style="margin-bottom: 10px;">
                    ${presets.map((preset, index) => `
                        <div class="preset-item" style="display: inline-block; margin: 0 5px 10px 0; position: relative;">
                            <button class="torn-btn load-preset-btn" data-index="${index}" style="margin: 0; padding-right: 30px;">
                                ${preset.name || "Preset " + (index + 1)}
                            </button>
                            <button class="delete-preset-btn" data-index="${index}"
                                style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #c00; cursor: pointer; font-size: 16px; padding: 0 5px;">
                                ×
                            </button>
                        </div>
                    `).join('')}
                </div>

                ${presets.length === 0 ? '<p style="color: #888; margin: 10px 0;">No presets saved. Click "Save Current" to create one!</p>' : ''}
            </div>
        </div>`;

        $('#racingAdditionalContainer > .form-custom-wrap').before(presetHTML);

        // Bind events
        $('.load-preset-btn').click(function() {
            const index = $(this).data('index');
            fillPreset(presets[index]);
        });

        $('.delete-preset-btn').click(function(e) {
            e.stopPropagation();
            const index = $(this).data('index');
            if (confirm(`Delete preset "${presets[index].name}"?`)) {
                presets.splice(index, 1);
                savePresets(presets);
                drawPresetBar();
            }
        });

        $('#save-new-preset-btn').click(function() {
            const presetName = prompt('Enter a name for this preset:');
            if (presetName && presetName.trim()) {
                const newPreset = getCurrentFormValues();
                newPreset.name = presetName.trim().substring(0, 25);
                presets.push(newPreset);
                if (savePresets(presets)) {
                    drawPresetBar();
                    alert('Preset saved successfully!');
                } else {
                    alert('Error saving preset.');
                }
            }
        });

        $('#export-presets-btn').click(function() {
            const json = JSON.stringify(presets, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'torn_race_presets.json';
            a.click();
            URL.revokeObjectURL(url);
        });

        $('#import-presets-btn').click(function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';
            input.onchange = function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        try {
                            const imported = JSON.parse(event.target.result);
                            if (Array.isArray(imported)) {
                                if (confirm(`Import ${imported.length} presets? This will replace your current presets.`)) {
                                    savePresets(imported);
                                    drawPresetBar();
                                    alert('Presets imported successfully!');
                                }
                            } else {
                                alert('Invalid preset file format.');
                            }
                        } catch (err) {
                            alert('Error parsing JSON file: ' + err.message);
                        }
                    };
                    reader.readAsText(file);
                }
            };
            input.click();
        });
    }

    // Initialize
    $('body').ajaxComplete(function(e, xhr, settings) {
        const createCustomRaceSection = "section=createCustomRace";
        const url = settings.url;
        if (url.indexOf(createCustomRaceSection) >= 0) {
            setTimeout(drawPresetBar, 100);
        }
    });
})();
