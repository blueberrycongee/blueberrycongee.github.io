/**
 * 数据结构可视化器 - 增强主题管理器
 * Data Structure Visualizer - Enhanced Theme Manager
 */

class ThemeManager {
  constructor() {
    this.currentTheme = this.getStoredTheme() || this.getSystemTheme();
    this.themeToggle = null;
    this.themeElements = [];
    this.init();
  }

  /**
   * 初始化主题管理器
   */
  init() {
    this.setupThemeToggle();
    this.applyTheme(this.currentTheme);
    this.setupThemeListeners();
    this.setupAutoTheme();
  }

  /**
   * 获取系统主题偏好
   */
  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * 获取存储的主题
   */
  getStoredTheme() {
    try {
      return localStorage.getItem('theme');
    } catch (error) {
      console.warn('无法访问 localStorage:', error);
      return null;
    }
  }

  /**
   * 存储主题偏好
   */
  storeTheme(theme) {
    try {
      localStorage.setItem('theme', theme);
    } catch (error) {
      console.warn('无法存储主题偏好:', error);
    }
  }

  /**
   * 设置主题切换器
   */
  setupThemeToggle() {
    // 查找现有的主题切换器
    this.themeToggle = document.querySelector('.theme-toggle-enhanced');
    
    // 如果没有找到，创建一个新的
    if (!this.themeToggle) {
      this.createThemeToggle();
    }

    // 添加点击事件监听器
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }
  }

  /**
   * 创建主题切换器
   */
  createThemeToggle() {
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle-enhanced';
    toggle.setAttribute('aria-label', '切换主题');
    toggle.setAttribute('role', 'switch');
    toggle.innerHTML = `
      <span class="theme-toggle-icon"></span>
      <span class="theme-toggle-label">主题</span>
    `;
    
    // 添加到页面
    document.body.appendChild(toggle);
    this.themeToggle = toggle;
  }

  /**
   * 应用主题
   */
  applyTheme(theme) {
    this.currentTheme = theme;
    
    // 设置 HTML 属性
    document.documentElement.setAttribute('data-theme', theme);
    
    // 设置 body 类名（向后兼容）
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
    
    // 更新主题切换器状态
    if (this.themeToggle) {
      this.themeToggle.setAttribute('data-theme', theme);
      this.themeToggle.setAttribute('aria-checked', theme === 'dark');
    }

    // 更新所有主题感知元素
    this.updateThemeElements(theme);
    
    // 触发主题变更事件
    this.dispatchThemeEvent(theme);
    
    // 存储主题偏好
    this.storeTheme(theme);
  }

  /**
   * 更新主题感知元素
   */
  updateThemeElements(theme) {
    // 更新 SVG 元素
    const svgElements = document.querySelectorAll('svg[data-theme-aware]');
    svgElements.forEach(svg => {
      svg.setAttribute('data-theme', theme);
    });

    // 更新 canvas 元素
    const canvasElements = document.querySelectorAll('canvas[data-theme-aware]');
    canvasElements.forEach(canvas => {
      canvas.setAttribute('data-theme', theme);
      // 触发 canvas 重绘
      const event = new CustomEvent('themeChange', { detail: { theme } });
      canvas.dispatchEvent(event);
    });

    // 更新其他主题感知元素
    const themeAwareElements = document.querySelectorAll('[data-theme-aware]');
    themeAwareElements.forEach(element => {
      element.setAttribute('data-theme', theme);
    });
  }

  /**
   * 切换主题
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    
    // 添加切换动画效果
    this.addToggleAnimation();
  }

  /**
   * 添加切换动画
   */
  addToggleAnimation() {
    // 创建过渡效果
    document.documentElement.style.setProperty('--theme-transition-duration', '500ms');
    
    // 添加临时类名以触发 CSS 动画
    document.body.classList.add('theme-transitioning');
    
    // 移除过渡类名
    setTimeout(() => {
      document.body.classList.remove('theme-transitioning');
    }, 500);
  }

  /**
   * 设置主题监听器
   */
  setupThemeListeners() {
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      // 只有在用户没有手动设置主题时才跟随系统
      if (!this.getStoredTheme()) {
        const newTheme = e.matches ? 'dark' : 'light';
        this.applyTheme(newTheme);
      }
    });

    // 监听键盘快捷键
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + Shift + L 切换主题
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        this.toggleTheme();
      }
    });
  }

  /**
   * 设置自动主题
   */
  setupAutoTheme() {
    // 根据时间自动切换主题（可选功能）
    const hour = new Date().getHours();
    const isNightTime = hour < 6 || hour >= 18;
    
    // 如果用户没有手动设置主题，根据时间自动设置
    if (!this.getStoredTheme()) {
      const autoTheme = isNightTime ? 'dark' : 'light';
      this.applyTheme(autoTheme);
    }
  }

  /**
   * 分发主题事件
   */
  dispatchThemeEvent(theme) {
    const event = new CustomEvent('themeChanged', {
      detail: { theme, previousTheme: this.currentTheme === theme ? (theme === 'dark' ? 'light' : 'dark') : this.currentTheme }
    });
    document.dispatchEvent(event);
  }

  /**
   * 获取当前主题
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * 设置特定主题
   */
  setTheme(theme) {
    if (theme === 'dark' || theme === 'light') {
      this.applyTheme(theme);
    }
  }

  /**
   * 重置为系统主题
   */
  resetToSystemTheme() {
    const systemTheme = this.getSystemTheme();
    this.applyTheme(systemTheme);
    
    // 清除存储的主题偏好
    try {
      localStorage.removeItem('theme');
    } catch (error) {
      console.warn('无法清除主题偏好:', error);
    }
  }

  /**
   * 添加主题变更监听器
   */
  onThemeChange(callback) {
    document.addEventListener('themeChanged', callback);
  }

  /**
   * 移除主题变更监听器
   */
  offThemeChange(callback) {
    document.removeEventListener('themeChanged', callback);
  }
}

// =====================================================
// 主题管理器实例化和初始化
// =====================================================

// 创建全局主题管理器实例
window.themeManager = new ThemeManager();

// 提供全局访问函数
window.getCurrentTheme = () => window.themeManager.getCurrentTheme();
window.setTheme = (theme) => window.themeManager.setTheme(theme);
window.toggleTheme = () => window.themeManager.toggleTheme();
window.resetTheme = () => window.themeManager.resetToSystemTheme();

// =====================================================
// 向后兼容函数
// =====================================================

/**
 * 向后兼容的主题切换函数
 */
function toggleThemeLegacy() {
  window.toggleTheme();
}

/**
 * 向后兼容的主题设置函数
 */
function setThemeLegacy(theme) {
  window.setTheme(theme);
}

// =====================================================
// 初始化完成后的回调
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  // 确保主题管理器已初始化
  if (window.themeManager) {
    console.log(`主题管理器已初始化，当前主题: ${window.themeManager.getCurrentTheme()}`);
    
    // 为现有元素添加主题感知能力
    const elementsToUpgrade = document.querySelectorAll('.topic-card, .card, .btn, .input, .canvas-container');
    elementsToUpgrade.forEach(element => {
      if (!element.hasAttribute('data-theme-aware')) {
        element.setAttribute('data-theme-aware', 'true');
      }
    });
  }
});

// 导出供模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
}