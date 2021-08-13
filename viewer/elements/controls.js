import { LitElement, html, css } from 'https://cdn.skypack.dev/lit-element@2.4.0';

import { DEBUG_DEFINES } from 'https://cdn.jsdelivr.net/npm/webgltf/lib/renderer/programs/gltf-program.js';

class WebGLTFViewerControls extends LitElement {
  static get properties() {
    return {
      hidden:     { type: Boolean, reflect: true },
      fullscreen: { type: Boolean },
      menu:       { type: String  },
      menus:      { type: Array   },
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.viewer = this.parentNode.host;
    this.menu = '';
  }

  render() {
    return html`
      ${this.getMenu()}
      <!-- <div class="animation">
        <webgltf-icon name="play"></webgltf-icon>
        <input type="range" />
        <div class="time">00:00 / 00:35</div>
      </div> -->
      <div class="buttons">
        <webgltf-icon name="question-circle" type="far" @click="${() => this.closeMenu()}"></webgltf-icon>

        <webgltf-icon name="cog"         @click="${() => this.openMenu('settings')}"></webgltf-icon>
        <webgltf-icon name="lightbulb"   @click="${() => this.openMenu('lighting')}"></webgltf-icon>
        <webgltf-icon name="street-view" @click="${() => this.openMenu('navigation')}"></webgltf-icon>
        <webgltf-icon name="cube"        @click="${() => this.openMenu('model')}"></webgltf-icon>

        <webgltf-icon name="vr-cardboard" disabled @click="${this.toggleXR}"></webgltf-icon>
        <webgltf-icon name="${this.fullscreen ? 'compress': 'expand'}" @click="${this.toggleFullscreen}"></webgltf-icon>
      </div>
    `;
  }

  toggleFullscreen() {
    this.fullscreen = !this.fullscreen;
    if(this.fullscreen) {
      this.viewer.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }

  toggleXR() {

  }

  openMenu(menu) {
    if(this.menu === menu) this.closeMenu();
    else this.menu = menu;
  }

  closeMenu() {
    this.menu = '';
  }

  getMenu() {
    const pages = this.menu.split('>').reduce((accum, value) => {
      return accum.concat(accum.length ? (accum[accum.length - 1] + '>' + value) : value)
    }, []).map(page => this.getMenuPage(page));

    return html`
      <div class="menu" ?open="${this.menu}">
        ${pages}
      </div>`;
  }

  getMenuPage(page) {
    const { sample, variant, material } = this.viewer;
    const materials = this.viewer.webgltf?.extensions?.KHR_materials_variants?.variants;

    let content = '';
    switch(page) {
      case 'model': {
        content = html`
          ${this.getSubMenuItem('model>sample',   'Sample',   sample)}
          ${this.getSubMenuItem('model>variant',  'Variant',  variant)}
          ${materials?.length ? this.getSubMenuItem('model>material', 'Material', material) : ''}
          ${this.getSubMenuItem('model>details',  'Details')}
        `;
        break;
      }
      case 'model>sample': {
        content = html`
          ${this.getBackMenuItem('Sample')}
          ${this.getSubMenuItem('model>sample>khronos', 'Khronos Samples')}
          ${this.getSubMenuItem('model>sample>webgltf', 'WebGLTF Samples')}
        `;
        break;
      }
      case 'model>sample>khronos': {
        content = html`
          ${this.getBackMenuItem('Khronos Samples')}
          <div class="list">
            ${this.viewer.samples.filter(({ group }) => group === 'Khronos').map(({ name }) => {
              const checked = this.viewer.sample === name;
              return this.getCheckMenuItem(name, checked, () => this.viewer.sample = name);
            })}
          </div>
          
        `;
        break;
      }
      case 'model>sample>webgltf': {
        content = html`
          ${this.getBackMenuItem('WebGLTF Samples')}
          <div class="list">
            ${this.viewer.samples.filter(({ group }) => group === 'WebGLTF').map(({ name }) => {
              const checked = this.viewer.sample === name;
              return this.getCheckMenuItem(name, checked, () => this.viewer.sample = name);
            })}
          </div>
        `;
        break;
      }
      case 'model>variant': {
        const sample = this.viewer.samples.find(({ name }) => name === this.viewer.sample);
        content = html`
          ${this.getBackMenuItem('Variant')}
          <div class="list">
            ${Object.keys(sample.variants).map((name) => {
              const checked = this.viewer.variant === name;
              return this.getCheckMenuItem(name, checked, () => this.viewer.variant = name);
            })}
          </div>
        `;
        break;
      }
      case 'model>material': {
        content = html`
          ${this.getBackMenuItem('Material')}
          <div class="list">
            ${materials?.map(({ name }) => {
              const checked = this.viewer.material === name;
              return this.getCheckMenuItem(name, checked, () => this.viewer.material = name);
            })}
          </div>
        `;
        break;
      }
      case 'model>details': {
        const sample = this.viewer.samples.find(({ name }) => name === this.viewer.sample);
        const { screenshot, source } = sample;
        const img = screenshot ? html`<img src="${screenshot}" class="screenshot" >` : '';
        const link = source ? html`<a href="${source}" target="_blank" class="source">Source</a>` : '';
        content = html`
          ${this.getBackMenuItem('Details')}
          ${img}
          ${link}
        `;
        break;
      }

      case 'navigation': {
        const value = this.viewer.webgltf.nodes[this.viewer.cameraId]?.camera ? this.viewer.webgltf.nodes[this.viewer.cameraId].name || `#${this.viewer.cameraId}` : 'Orbit Camera';
        content = html`
          ${this.getSubMenuItem('navigation>camera', 'Camera', value)}
        `;
        break;
      }

      case 'navigation>camera': {
        let cameras = this.viewer.webgltf ? this.viewer.webgltf.nodes.filter((node) => node.camera) : [];

        cameras = [
          { id: -1, node: { name: 'Orbit Camera'} },
          ...cameras.map((node) => ({ id: this.viewer.webgltf.nodes.indexOf(node), node })),
        ];

        content = html`
          ${this.getBackMenuItem('Camera')}
          <div class="list">
            ${cameras.map(({ id, node }) => {
              const checked = this.viewer.cameraId === id;
              return this.getCheckMenuItem(node.name || `#${id}`, checked, () => this.viewer.cameraId = id);
            })}
          </div>
          
        `;
        break;
      }

      case 'lighting': {
        content = html`
          ${this.getSubMenuItem('lighting>punctual', 'Punctual Lighting',              this.viewer.usePunctual ? 'On': 'Off')}
          ${this.getSubMenuItem('lighting>ibl',      'Image Based Lighting',           this.viewer.useIBL      ? 'On': 'Off')}
          ${this.getSubMenuItem('lighting>ssao',     'Screen Space Ambient Occlusion', this.viewer.useSSAO     ? 'On': 'Off')}
          ${this.getSubMenuItem('lighting>shadows',  'Shadows',                        this.viewer.useShadows  ? 'On': 'Off')}
          ${this.getSubMenuItem('lighting>tonemap',  'Tonemap',                        this.viewer.tonemap)}
        `;
        break;
      }
      case 'lighting>punctual': {
        content = html`
          ${this.getBackMenuItem('Punctual Lighting')}
          <div class="list">
            ${this.getCheckMenuItem('On', this.viewer.usePunctual, () => this.viewer.usePunctual = true )}
            ${this.getCheckMenuItem('Off', !this.viewer.usePunctual, () => this.viewer.usePunctual = false )}
          </div>
        `;
        break;
      }
      case 'lighting>ibl': {
        content = html`
          ${this.getBackMenuItem('Image Based Lighting')}
          <div class="list">
            ${this.getCheckMenuItem('On', this.viewer.useIBL, () => this.viewer.useIBL = true )}
            ${this.getCheckMenuItem('Off', !this.viewer.useIBL, () => this.viewer.useIBL = false )}
          </div>
          ${this.getSubMenuItem('lighting>ibl>environment', 'Environment', this.viewer.environment)}
        `;
        break;
      }
      case 'lighting>ibl>environment': {
        content = html`
          ${this.getBackMenuItem('Environment')}
          <div class="list">
            ${this.viewer.environments.map(({ name }) => {
              const checked = this.viewer.environment === name;
              return this.getCheckMenuItem(name, checked, () => this.viewer.environment = name);
            })}
          </div>
        `;
        break;
      }
      case 'lighting>ssao': {
        content = html`
          ${this.getBackMenuItem('Screen Space Ambient Occlusion')}
          <div class="list">
            ${this.getCheckMenuItem('On', this.viewer.useSSAO, () => this.viewer.useSSAO = true )}
            ${this.getCheckMenuItem('Off', !this.viewer.useSSAO, () => this.viewer.useSSAO = false )}
          </div>
        `;
        break;
      }
      case 'lighting>shadows': {
        const shadows = this.viewer.renderer.settings.shadows;
        content = html`
          ${this.getBackMenuItem('Shadows')}
          <div class="list">
            ${this.getCheckMenuItem('On', this.viewer.useShadows, () => this.viewer.useShadows = true )}
            ${this.getCheckMenuItem('Off', !this.viewer.useShadows, () => this.viewer.useShadows = false )}
          </div>
          <!-- ${this.getSliderMenuItem('Bias', 1, 0, 10, shadows.bias, (e) => shadows.bias = parseFloat(e.target.value))} -->
          ${this.getSliderMenuItem('Lambda', 0.01, 0.1, 1.0, shadows.lambda, (e) => shadows.lambda = parseFloat(e.target.value))}
        `;
        break;
      }
      case 'lighting>tonemap': {
        content = html`
          ${this.getBackMenuItem('Tonemap')}
          <div class="list">
            ${this.getCheckMenuItem('Aces Hill', this.viewer.tonemap === 'Aces Hill', () => this.viewer.tonemap = 'Aces Hill' )}
            ${this.getCheckMenuItem('Aces Hill Exposure Boost', this.viewer.tonemap === 'Aces Hill Exposure Boost', () => this.viewer.tonemap = 'Aces Hill Exposure Boost' )}
            ${this.getCheckMenuItem('Aces Narkowicz', this.viewer.tonemap === 'Aces Narkowicz', () => this.viewer.tonemap = 'Aces Narkowicz' )}
            ${this.getCheckMenuItem('Off', !this.viewer.tonemap, () => this.viewer.tonemap = '' )}
          </div>
        `;
        break;
      }

      case 'settings': {
        content = html`
          ${this.getSubMenuItem('settings>dof', 'Depth of Field', this.viewer.useDOF ? 'On': 'Off')}
          ${this.getSubMenuItem('settings>debug', 'Debug', this.getDebugModes().find(({ define }) => this.viewer.debug === define)?.name || 'None')}
        `;
        break;
      }
      case 'settings>dof': {
        const dof = this.viewer.renderer.settings.dof;
        content = html`
          ${this.getBackMenuItem('Depth of Field')}
          <div class="list">
            ${this.getCheckMenuItem('On', this.viewer.useDOF, () => this.viewer.useDOF = true )}
            ${this.getCheckMenuItem('Off', !this.viewer.useDOF, () => this.viewer.useDOF = false )}
          </div>
          ${this.getSliderMenuItem('Range', 0.5, 0.5, 25.0, dof.range, (e) => dof.range = parseFloat(e.target.value))}
        `;
        break;
      }
      case 'settings>debug': {
        content = html`
          ${this.getBackMenuItem('Debug')}
          <div class="list">
            ${this.getDebugModes().map(({ name, define }) => {
              return this.getCheckMenuItem(name, this.viewer.debug === define, () => this.viewer.debug = define )
            })}
          </div>
        `;
        break;
      }
    }
    return html`<div class="page" page="${page}">${content}</div>`;
  }

  closeSubMenu() {
    this.menu = this.menu.split('>').slice(0, -1).join('>');
  }

  getSubMenuItem(submenu, label, value) {
    return html`
      <div class="item submenu" @click="${() => this.openMenu(submenu)}">
        <div class="label">${label}</div>
        <div class="value" title="${value}">${value}</div>
        <webgltf-icon name="angle-right"></webgltf-icon>
      </div>`;
  }

  getBackMenuItem(label) {
    return html`
      <div class="item back" @click="${() => this.closeSubMenu()}">
        <webgltf-icon name="angle-left"></webgltf-icon>
        <div class="label">${label}</div>
      </div>
    `;
  }

  getCheckMenuItem(label, checked, action) {
    return html`
      <div class="item check" @click="${action}" ?checked=${checked}>
        <webgltf-icon name="check"></webgltf-icon>
        <div class="label">${label}</div>
      </div>
    `
  }

  getSliderMenuItem(label, step, min, max, value, action) {
    return html`
      <div class="item slider">
        <div class="label">${label}</div>
        <input type="range" step="${step}" min="${min}" max="${max}" value="${value}" @input="${(e) => action(e) && (e.target.nextSibling.value = e.target.value)}"/><output>${value}</output>
      </div>`;
  }

  getDebugModes() {
    return Object.keys(DEBUG_DEFINES).filter(define => define !== 'DEBUG').map((define) => {
      const name = define.replace('DEBUG_', '').toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase()).replace('rgb', 'RGB');
      return { name, define };
    });
  }

  static get styles() {
    return css`
      :host {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        background: rgba(0, 0, 0, 0.75);
        transition: opacity 0.5s ease-in-out;

        display: flex;
        flex-direction: column;
        padding: 12px;
      }

      :host([hidden]) {
        opacity: 0;
      }

      .buttons {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        gap: 16px;
      }

      webgltf-icon {
        user-select: none;
        font-size: large;
      }

      webgltf-icon:hover:not([disabled]) {
        cursor: pointer;
        color: #fff;
      }

      webgltf-icon[disabled] {
        opacity: 0.25;
      }

      .animation {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 16px;
      }

      .animation input {
        flex: 1;
        height: 3px;
        filter: grayscale(1);
      }

      .menu {
        position: absolute;
        margin: 12px;
        right: 0;
        bottom: 56px;
        background: rgba(0,0,0, 0.75);
        opacity: 0;
        transition: opacity 0.2s;
        user-select: none;

        display: flex;
        flex-direction: row;
      }

      .menu[open] {
        opacity: 1;
        overflow: hidden;
      }

      .menu .page {
        display: flex;
        flex-direction: column;
        min-width: 300px;
        /* transition: max-width 0.2s, opacity 0.2s, max-height 0.2s; */
      }

      .menu .item {
        padding: 16px;
        display: flex;
        flex-direction: row;
        gap: 16px;
        align-items: center;
        cursor: pointer;
      }

      .menu .item:hover {
        background: rgba(0,0,0,0.5);
      }

      .submenu .label {
        flex: 1;
      }

      .submenu .value {
        max-width: 150px;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        text-align: right;
      }

      .page:not(:last-child) {
        max-width: 0px;
        min-width: 0px;
        max-height: 0px;
        display: none;
      }

      .page:last-child {
        opacity: 1;
      }

      .page .back {
        position: sticky; 
        top: 0;
      }

      .page .list {
        max-height: 50vh;
        overflow: auto;
      }

      .page .list .item:not([checked]) webgltf-icon {
        opacity: 0;
      }

      .page .screenshot {
        max-width: 300px;
        padding: 16px;
      }

      .page a {
        color: inherit;
        padding: 16px;
      }

      .page a:hover {
        color: var(--primary-text);
      }

      .menu .item.slider input {
        flex: 1;
      }
    `;
  }
}

customElements.define('webgltf-viewer-controls', WebGLTFViewerControls);


