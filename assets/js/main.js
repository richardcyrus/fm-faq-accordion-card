(function (w, doc, undefined) {
  "use strict";

  const Accordion = {};
  w.Accordion = Accordion;

  const widgetClass = "accordion";
  const widgetTriggerClass = `${widgetClass}__trigger`;
  const widgetHeadingClass = `${widgetClass}__heading`;
  const widgetPanelClass = `${widgetClass}__panel`;

  const widgetHeading = "[data-accordion-heading]";
  const widgetPanel = "[data-accordion-panel]";

  let idCounter = 0;

  Accordion.create = function () {
    let self;
    let panels;
    let defaultPanel = "none";
    let headings;
    let triggers;
    let constantPanel;
    let multiPanel;
    let i;

    const widget = doc.querySelectorAll("[data-accordion]");

    idCounter += 1;

    for (i = 0; i < widget.length; i++) {
      self = widget[i];

      /**
       * Check for IDs and create arrays of necessary panels and headings for
       * additional setup functions.
       */
      if (!self.hasAttribute("id")) {
        self.id = `accordion_${idCounter}-${i}`;
      }

      /**
       * Add accordion classes
       */
      self.classList.add(widgetClass);

      /**
       * Get all panels and heading of an accordion pattern based on a specific
       * ID > direct child selector, this will ensure that nested accordions
       * don't get properties meant for the parent accordion, or vice-versa.
       */
      panels = doc.querySelectorAll(
        `#${self.id} > .accordion__item > ${widgetPanel}`
      );
      headings = doc.querySelectorAll(
        `#${self.id} > .accordion__item > ${widgetHeading}`
      );

      /**
       * Check for options:
       * data-default - is there a default opened panel?
       * data-constant - should the accordion always have a panel open?
       */
      if (self.hasAttribute("data-default")) {
        defaultPanel = self.getAttribute("data-default");
      }

      /**
       * Accordions with a constantly open panel are not a defult, but if
       * a data-constant attribute is used, then we need this to be true.
       */
      constantPanel = self.hasAttribute("data-constant");

      /**
       * Accordions can have multiple panels open at a time if they have a
       * data-multi attribute.
       */
      multiPanel = self.hasAttribute("data-multi");

      /**
       * If accordion panels are meant to transition, apply this inline style.
       * This is to help mitigate a quick flash of CSS being applied to the
       * no-js styling, and having an unwanted transition on page load.
       */
      if (self.hasAttribute("data-transition")) {
        const thesePanels = self.querySelectorAll(widgetPanel);

        for (let t = 0; t < thesePanels.length; t++) {
          thesePanels[t].classList.add(`${widgetPanelClass}--transition`);
        }
      }

      /**
       * Setup Panels, Headings & Buttons
       */
      Accordion.setupPanels(self.id, panels, defaultPanel, constantPanel);
      Accordion.setupHeadingButton(headings, constantPanel);

      triggers = doc.querySelectorAll(
        `#${self.id} > .accordion__item > ${widgetHeading} .${widgetTriggerClass}`
      );

      /**
       * Now that the headings/triggers and panels are setup, we can grab all
       * the triggers and setup their functionality.
       */
      for (let t = 0; t < triggers.length; t++) {
        triggers[t].addEventListener("click", Accordion.actions);
        triggers[t].addEventListener("keydown", Accordion.keytrolls);
      }
    } // for loop
  }; // Accordion.create()

  Accordion.setupPanels = function (id, panels, defaultPanel, constantPanel) {
    let i;
    let panel;
    let panelId;
    let setPanel;
    let constant;

    for (i = 0; i < panels.length; i++) {
      panel = panels[i];
      panelId = `${id}_panel_${i + 1}`;
      setPanel = defaultPanel;
      constant = constantPanel;

      panel.setAttribute("id", panelId);
      ariaHidden(panels[0], true);

      panel.classList.add(widgetPanelClass);

      /**
       * Set the accordion to have the appropriately opened panel if a
       * data-default value is set. If no value set, then no panels are open.
       */
      if (setPanel !== "none" && parseInt(setPanel) !== NaN) {
        if (setPanel <= 1) {
          ariaHidden(panels[0], false);
        }
        // If the value is more than the number of panels, then open the last
        // panel by default.
        else if (setPanel - 1 >= panels.length) {
          ariaHidden(panels[panels.length - 1], false);
        }
        // for any other value between 2 and the last panel number, open that one.
        else {
          ariaHidden(panels[setPanel - 1], false);
        }
      }

      /**
       * If an accordion is meant to have a consistently open panel,
       * and a default open panel was not set (or was not set correctly),
       * then run one more check.
       */
      if ((constant && setPanel === "none") || parseInt(setPanel) === NaN) {
        ariaHidden(panels[0], false);
      }
    } // for loop
  }; // Accordion.setupPanels()

  Accordion.setupHeadingButton = function (headings, constantPanel) {
    let heading;
    let targetId;
    let targetState;
    let newButton;
    let buttonText;
    let i;

    for (i = 0; i < headings.length; i++) {
      heading = headings[i];
      targetId = heading.nextElementSibling.id;
      targetState = doc.getElementById(targetId).getAttribute("aria-hidden");

      newButton = doc.createElement("button");
      buttonText = heading.textContent;
      heading.innerHTML = "";
      heading.classList.add(widgetHeadingClass);

      newButton.setAttribute("type", "button");
      newButton.setAttribute("aria-controls", targetId);
      newButton.setAttribute("id", `${targetId}_trigger`);
      newButton.classList.add(widgetTriggerClass);

      // This needs to be in the loop otherwise it's only added to the last
      // button.
      const buttonIcon = doc.createElement("img");
      buttonIcon.setAttribute("src", "./assets/images/icon-arrow-down.svg");
      buttonIcon.setAttribute("aria-hidden", "true");
      buttonIcon.setAttribute("focusable", "false");
      buttonIcon.setAttribute("alt", "");

      /**
       * Check the corresponding panel to see if it was setup to be hidden
       * or shown by default. Add an aria-expanded attribute value that
       * is appropriate.
       */
      if (targetState === "false") {
        ariaExpanded(newButton, true);
        isCurrent(newButton, true);

        /**
         * Check to see if this an accordion that needs a constantly opened
         * panel, and if the button's target is not hidden.
         */
        if (constantPanel) {
          newButton.setAttribute("aria-disabled", "true");
        }
      } else {
        ariaExpanded(newButton, false);
        isCurrent(newButton, false);
      }

      // Add the button & previous heading text
      heading.appendChild(newButton);
      newButton.appendChild(doc.createTextNode(buttonText));
      newButton.appendChild(buttonIcon);
    }
  }; // Accordion.setupHeadingButton()

  Accordion.actions = function (e) {
    const thisAccordion = this.id.replace(/_panel.*$/g, "");
    const thisTarget = doc.getElementById(this.getAttribute("aria-controls"));
    let thisTriggers;

    thisTriggers = doc.querySelectorAll(
      `#${thisAccordion} > .accordion__item > ${widgetHeading} .${widgetTriggerClass}`
    );

    e.preventDefault();

    Accordion.togglePanel(e, thisAccordion, thisTarget, thisTriggers);
  }; // Accordion.actions()

  Accordion.togglePanel = function (e, thisAccordion, targetPanel, triggers) {
    let getId;
    let i;
    const thisTrigger = e.target;

    if (thisTrigger.getAttribute("aria-disabled") !== "true") {
      getId = thisTrigger.getAttribute("aria-controls");
      isCurrent(thisTrigger, true);

      if (thisTrigger.getAttribute("aria-expanded") === "true") {
        ariaExpanded(thisTrigger, false);
        ariaHidden(targetPanel, true);
      } else {
        ariaExpanded(thisTrigger, true);
        ariaHidden(targetPanel, false);

        if (doc.getElementById(thisAccordion).hasAttribute("data-constant")) {
          ariaDisabled(thisTrigger, true);
        }
      }

      if (
        doc.getElementById(thisAccordion).hasAttribute("data-constant") ||
        !doc.getElementById(thisAccordion).hasAttribute("data-multi")
      ) {
        for (i = 0; i < triggers.length; i++) {
          if (thisTrigger !== triggers[i]) {
            isCurrent(triggers[i], false);
            getId = triggers[i].getAttribute("aria-controls");
            ariaDisabled(triggers[i], false);
            ariaExpanded(triggers[i], false);
            ariaHidden(doc.getElementById(getId), true);
          }
        }
      }
    }
  }; // Accordion.togglePanel()

  Accordion.keytrolls = function (e) {
    if (e.target.classList.contains(widgetTriggerClass)) {
      let keyCode = e.keyCode || e.which;

      const keyHome = 36;
      const keyEnd = 35;

      const thisAccordion = this.id.replace(/_panel.*$/g, "");
      const thisTriggers = doc.querySelectorAll(
        `#${thisAccordion} > .accordion__item > ${widgetHeading} .${widgetTriggerClass}`
      );

      switch (keyCode) {
        /**
         * keyEnd/Home are optional functions that may not be inherently known
         * to most users and, in the case of END, conflict with expected
         * usage of that key with NVDA.
         */
        case keyEnd:
          e.preventDefault();
          thisTriggers[thisTriggers.length - 1].focus();
          break;
        case keyHome:
          e.preventDefault();
          thisTriggers[0].focus();
          break;
        default:
          break;
      }
    }
  }; // Accordion.keytrolls()

  /**
   * Helper Functions
   */
  const ariaHidden = function (el, state) {
    el.setAttribute("aria-hidden", state);
  };

  const ariaExpanded = function (el, state) {
    el.setAttribute("aria-expanded", state);
  };

  const ariaDisabled = function (el, state) {
    el.setAttribute("aria-disabled", state);
  };

  const isCurrent = function (el, state) {
    el.setAttribute("data-current", state);
  };

  /**
   * Initialize the Accordion functions
   */
  Accordion.init = function () {
    Accordion.create();
  };

  // Launch the script
  Accordion.init();
})(window, document);
