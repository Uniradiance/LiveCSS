# 实时CSS与JS编辑器

这是一款简单的Chrome小扩展，可让您向任意网站注入自定义的CSS和JavaScript代码。为常用网站打造专属主题、优化页面布局，甚至添加实用新功能。

## 核心功能

- **实时CSS编辑**：即时修改任意元素的样式，所见即所得。
- **高级样式支持**：支持内联样式及伪类/伪元素（如 `:hover` 或 `::before`）。
- **精准元素定位**：使用标准CSS选择器匹配目标元素；若匹配多个，可指定索引（如 `0`、`1`）精确定位单个元素。
- **自定义JS注入**：在页面主上下文中执行JavaScript脚本，完全访问DOM和页面变量，实现复杂功能。
- **路径规则匹配**：按URL路径设置不同规则（例如首页 `/` 应用一套样式，`/dashboard/*` 应用另一套）。
- **自动保存到浏览器**：所有配置实时保存，即使刷新页面或重启浏览器也不会丢失。
- **简洁操作界面**：提供可拖拽、可缩放的悬浮面板，管理样式和脚本更高效。
- **数据备份与共享**：一键导出当前域名所有配置为JSON文件，方便备份或分享；导入时可快速恢复配置。
- **内容清空选项**：可选在应用样式前清空目标元素内容，避免干扰。

## 使用指南

### 1. 打开编辑面板
点击Chrome工具栏中的扩展图标，即可在当前页面开启或关闭编辑面板。

### 2. 面板功能详解
面板包含以下核心区域：
- **标题栏**：显示面板名称，拖拽可移动位置，点击 `X` 关闭面板。
- **匹配模式设置**（关键设置）：
  - **域名**：自动显示当前网站域名（如 `www.example.com`），不可修改，规则按域名独立保存。
  - **路径规则**：设置规则生效范围（支持通配符 `*`）：
    - `*`：应用于该域名下所有页面。
    - `/`：仅首页生效。
    - `/articles/*`：匹配所有 `/articles/` 开头的页面。
- **CSS规则区**：编辑CSS样式的核心区域，每条规则可展开/折叠。
- **全局JS区**：面板底部区域，用于编写全站生效的JavaScript脚本。
- **操作按钮**：
  - `添加新规则`：新增空白CSS规则块。
  - `导出`：将当前域名配置保存为JSON文件。
  - `导入`：选择JSON文件恢复配置（**会覆盖当前域名所有规则**）。
  - `全部清除`：删除当前域名下所有配置。

### 3. 创建CSS规则
1. 点击 **添加新规则**，生成空白规则块。
2. **输入选择器**：在规则标题栏填写CSS选择器（如 `.main-content`、`#sidebar`）。
3. **规则选项**（标题栏右侧）：
   - **清空内容**：开启后，先清空目标元素内容再应用样式。
   - **元素索引**：多元素匹配时，输入数字（如 `1`）指定生效位置；留空则应用到所有匹配元素。
4. **编辑样式**：
   - 点击 **添加属性**，输入CSS属性（如 `background-color`）和值（如 `#333`），修改实时生效。
   - 可添加多组属性，点击垃圾桶图标删除多余项。
5. **编辑伪类样式**：
   - 在“伪类样式”区点击 **添加伪类**，输入伪类/伪元素（如 `:hover`）。
   - 在子规则内添加CSS属性，仅在对应状态（如鼠标悬停）时生效。

### 4. 编写JavaScript
1. 点击面板底部的 **全局JS** 标题展开编辑器。
2. 用标题栏 **开关** 控制脚本启用/禁用。
3. 在编辑区编写JS代码，脚本与页面原生代码同权限，适用于DOM操作、事件监听等高级功能。

> **提示**：所有修改均自动保存，无需手动操作。立即体验，轻松定制您的专属网页！

# Live CSS & JS Editor

A Simple Chrome extension that allows you to inject custom CSS and JavaScript into any website. Your modifications are saved locally and automatically reapplied on subsequent visits, allowing you to create persistent custom themes, tweak layouts, and add functionality to your favorite sites.

## Features

- **Live CSS Editing**: Instantly apply CSS changes to any element.
- **Advanced Styling**: Supports both direct inline styles and pseudo-classes/elements (like `:hover` or `::before`).
- **Powerful Selectors**: Target elements using standard CSS selectors and specify a particular element by its index if multiple are found.
- **Custom JavaScript Injection**: Execute your own JavaScript on any page, running in the page's main context for full access to DOM and page variables.
- **Path-Based Rules**: Create different sets of rules for different sections of the same website using URL path patterns (e.g., apply one style for `/` and another for `/dashboard/*`).
- **Persistent Storage**: All your configurations are saved automatically and survive page reloads and browser restarts.
- **User-Friendly UI**: A clean, draggable, and resizable panel for managing your styles and scripts.
- **Data Management**: Easily export your configurations for a domain as a JSON file for backup or sharing, and import them just as easily.
- **Content Clearing**: An option to completely clear the inner content of an element before applying styles.

## How to Use

### 1. Toggling the Panel

Click the extension's icon in the Chrome toolbar to open or close the editor panel on the current page.

### 2. Understanding the Interface

The panel is composed of several key sections:

- **Header**: Displays the title. You can click and drag the header to move the panel around the screen. The `X` button closes the panel.
- **Match Pattern Bar**: This is crucial for controlling where your rules apply.
  - **Hostname**: The current website's domain (e.g., `www.example.com`) is shown here and is not editable. All rules are saved per-domain.
  - **Path Input**: This field determines which pages *within* the domain the current set of rules applies to. You can use `*` as a wildcard.
    - `*`: Matches all pages on the domain.
    - `/`: Matches only the homepage.
    - `/articles/*`: Matches any page whose path starts with `/articles/`.
- **CSS Rules**: The main area where you define your CSS modifications. Each rule is a collapsible item.
- **Global JavaScript**: A collapsible section at the bottom where you can write custom JavaScript for the matched path.
- **Footer Actions**: Buttons for managing your rules.
  - `Add New Rule`: Adds a new, empty CSS rule block.
  - `Export`: Downloads all configurations for the current domain as a `.json` file.
  - `Import`: Opens a file dialog to import a `.json` configuration file, which will **overwrite all existing rules** for the current domain.
  - `Clear All`: Deletes all configurations for the current domain.

### 3. Creating and Editing CSS Rules

1.  Click **Add New Rule** to start. A new block will appear.
2.  **Selector Input**: In the header of the new block, enter a CSS selector to target the element(s) you want to style (e.g., `.main-content`, `#sidebar`, `div.article > p`).
3.  **Rule Options** (in the header, to the right of the selector):
    - **Clear Content Toggle**: When enabled, the extension will remove all content inside the targeted element(s) before applying your styles.
    - **Element Index**: If your selector matches multiple elements, you can enter a number here (e.g., `0`, `1`, `2`) to apply the style *only* to that specific element in the list. Leave it blank to apply to all matched elements.
4.  **Editing Styles**:
    - Inside the rule block, under the "Styles" section, click **Add Property**.
    - Two input fields will appear. Enter the CSS property in the left field (e.g., `background-color`) and its value in the right field (e.g., `#333`). The style is applied instantly.
    - You can add as many properties as you need.
    - To remove a property, click the trash can icon next to it.
5.  **Editing Pseudo-class Styles**:
    - Under the "Pseudo-class Styles" section, click **Add Pseudo-class**.
    - A new sub-block appears. In its header, enter the pseudo-class or pseudo-element (e.g., `:hover`, `::after`).
    - Inside this sub-block, add CSS properties just as you did for regular styles. These will only apply during the specified state (e.g., when the user hovers over the element).

### 4. Writing Custom JavaScript

1.  Click on the **Global JavaScript** header at the bottom of the panel to expand the editor.
2.  Use the **toggle switch** in the header to enable or disable the script's execution.
3.  Write your JavaScript code in the text area. The script will be executed in the page's context, giving you the same level of access as a script written directly into the page's HTML. This is useful for complex DOM manipulations, adding event listeners, or interacting with the page's existing JavaScript.

**Note**: Changes to styles and scripts are saved automatically as you make them.