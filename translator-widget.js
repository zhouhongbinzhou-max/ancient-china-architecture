// 智能翻译器悬浮小部件
(function() {
    // 创建翻译器小部件
    function createTranslatorWidget() {
        // 主容器
        const widget = document.createElement('div');
        widget.id = 'translator-widget';
        widget.innerHTML = `
            <div class="translator-toggle" id="translatorToggle">
                <span class="translator-icon">🌐</span>
            </div>
            <div class="translator-panel" id="translatorPanel">
                <div class="translator-panel-header">
                    <h3>🌐 智能翻译</h3>
                    <button class="translator-close" id="translatorClose">✕</button>
                </div>
                <div class="translator-panel-body">
                    <div class="translator-option">
                        <label>源语言：</label>
                        <select id="sourceLang">
                            <option value="zh">中文</option>
                            <option value="en">英语</option>
                            <option value="ja">日语</option>
                            <option value="ko">韩语</option>
                            <option value="fr">法语</option>
                            <option value="es">西班牙语</option>
                            <option value="de">德语</option>
                            <option value="ru">俄语</option>
                        </select>
                    </div>
                    <div class="translator-option">
                        <label>目标语言：</label>
                        <select id="targetLang">
                            <option value="en">英语</option>
                            <option value="zh">中文</option>
                            <option value="ja">日语</option>
                            <option value="ko">韩语</option>
                            <option value="fr">法语</option>
                            <option value="es">西班牙语</option>
                            <option value="de">德语</option>
                            <option value="ru">俄语</option>
                        </select>
                    </div>
                    <button class="translator-btn" id="translateBtn">
                        <span class="btn-text">开始翻译</span>
                        <span class="btn-loading" style="display:none;">翻译中...</span>
                    </button>
                    <div class="translator-progress" id="translatorProgress" style="display:none;">
                        <div class="progress-bar">
                            <div class="progress-fill" id="progressFill"></div>
                        </div>
                        <div class="progress-text" id="progressText">0%</div>
                    </div>
                </div>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            #translator-widget {
                position: fixed;
                bottom: 30px;
                right: 30px;
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                user-select: none;
                -webkit-user-select: none;
            }
            
            #translator-widget.dragging {
                cursor: grabbing;
            }
            
            #translator-widget .translator-toggle {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                box-shadow: 0 4px 20px rgba(102,126,234,0.4);
                cursor: grab;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                animation: pulse 2s infinite;
            }
            
            #translator-widget .translator-toggle:active {
                cursor: grabbing;
            }
            
            #translator-widget .translator-toggle:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 25px rgba(102,126,234,0.5);
            }
            
            #translator-widget .translator-icon {
                font-size: 28px;
                pointer-events: none;
            }
            
            @keyframes pulse {
                0%, 100% {
                    box-shadow: 0 4px 20px rgba(102,126,234,0.4);
                }
                50% {
                    box-shadow: 0 4px 30px rgba(102,126,234,0.6);
                }
            }
            
            #translator-widget .translator-panel {
                position: absolute;
                bottom: 80px;
                right: 0;
                width: 320px;
                background: #fff;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.15);
                overflow: hidden;
                transform: scale(0) translateY(20px);
                transform-origin: bottom right;
                transition: all 0.3s ease;
                opacity: 0;
                user-select: none;
                -webkit-user-select: none;
            }
            
            #translator-widget .translator-panel.active {
                transform: scale(1) translateY(0);
                opacity: 1;
            }
            
            #translator-widget .translator-panel-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #fff;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: grab;
            }
            
            #translator-widget .translator-panel-header:active {
                cursor: grabbing;
            }
            
            #translator-widget .translator-panel-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                pointer-events: none;
            }
            
            #translator-widget .translator-close {
                background: rgba(255,255,255,0.2);
                border: none;
                color: #fff;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }
            
            #translator-widget .translator-close:hover {
                background: rgba(255,255,255,0.3);
                transform: rotate(90deg);
            }
            
            #translator-widget .translator-panel-body {
                padding: 20px;
            }
            
            #translator-widget .translator-option {
                margin-bottom: 15px;
            }
            
            #translator-widget .translator-option label {
                display: block;
                font-size: 13px;
                font-weight: 500;
                color: #555;
                margin-bottom: 6px;
            }
            
            #translator-widget .translator-option select {
                width: 100%;
                padding: 10px 12px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                font-size: 14px;
                outline: none;
                transition: all 0.2s;
                background: #fff;
                cursor: pointer;
            }
            
            #translator-widget .translator-option select:focus {
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
            }
            
            #translator-widget .translator-btn {
                width: 100%;
                padding: 12px;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                border: none;
                border-radius: 8px;
                color: #fff;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
                margin-top: 10px;
            }
            
            #translator-widget .translator-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(245,87,108,0.4);
            }
            
            #translator-widget .translator-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
            
            #translator-widget .btn-loading {
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            
            #translator-widget .btn-loading::before {
                content: '';
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top-color: #fff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            #translator-widget .translator-progress {
                margin-top: 15px;
                display: none;
            }
            
            #translator-widget .progress-bar {
                height: 6px;
                background: #f0f0f0;
                border-radius: 3px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            
            #translator-widget .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                width: 0%;
                transition: width 0.3s ease;
                border-radius: 3px;
            }
            
            #translator-widget .progress-text {
                text-align: center;
                font-size: 12px;
                color: #666;
                font-weight: 500;
            }
            
            /* 移动端适配 */
            @media (max-width: 768px) {
                #translator-widget {
                    bottom: 20px;
                    right: 20px;
                }
                
                #translator-widget .translator-toggle {
                    width: 50px;
                    height: 50px;
                }
                
                #translator-widget .translator-icon {
                    font-size: 24px;
                }
                
                #translator-widget .translator-panel {
                    width: 280px;
                    bottom: 70px;
                }
            }
        `;
        
        widget.appendChild(style);
        document.body.appendChild(widget);
        
        // 绑定事件
        initWidgetEvents();
    }
    
    // 初始化小部件事件
    function initWidgetEvents() {
        const widget = document.getElementById('translator-widget');
        const toggle = document.getElementById('translatorToggle');
        const panel = document.getElementById('translatorPanel');
        const panelHeader = panel.querySelector('.translator-panel-header');
        const closeBtn = document.getElementById('translatorClose');
        const translateBtn = document.getElementById('translateBtn');
        const sourceLang = document.getElementById('sourceLang');
        const targetLang = document.getElementById('targetLang');
        const progress = document.getElementById('translatorProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        // 拖动功能变量
        let isDragging = false;
        let isPanelDragging = false;
        let startX, startY, initialRight, initialBottom;
        let panelStartX, panelStartY, panelInitialRight, panelInitialBottom;
        
        // 切换面板显示
        toggle.addEventListener('click', (e) => {
            if (!isDragging) {
                panel.classList.toggle('active');
            }
        });
        
        // 关闭面板
        closeBtn.addEventListener('click', () => {
            panel.classList.remove('active');
        });
        
        // 点击外部关闭面板
        document.addEventListener('click', (e) => {
            if (!widget.contains(e.target)) {
                panel.classList.remove('active');
            }
        });
        
        // ===== 翻译器按钮拖动功能 =====
        toggle.addEventListener('mousedown', (e) => {
            isDragging = false;
            startX = e.clientX;
            startY = e.clientY;
            
            const rect = widget.getBoundingClientRect();
            initialRight = window.innerWidth - rect.right;
            initialBottom = window.innerHeight - rect.bottom;
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            
            function onMouseMove(e) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                
                // 如果移动距离超过 5px，认为是拖动而不是点击
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                    isDragging = true;
                    widget.classList.add('dragging');
                    
                    widget.style.right = (initialRight - dx) + 'px';
                    widget.style.bottom = (initialBottom - dy) + 'px';
                    widget.style.left = 'auto';
                    widget.style.top = 'auto';
                }
            }
            
            function onMouseUp() {
                widget.classList.remove('dragging');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                
                // 保存位置到 localStorage
                const rect = widget.getBoundingClientRect();
                const right = window.innerWidth - rect.right;
                const bottom = window.innerHeight - rect.bottom;
                localStorage.setItem('translator_widget_position', JSON.stringify({ right, bottom }));
            }
        });
        
        // 触摸拖动支持（移动端）
        toggle.addEventListener('touchstart', (e) => {
            isDragging = false;
            const touch = e.touches[0];
            startX = touch.clientX;
            startY = touch.clientY;
            
            const rect = widget.getBoundingClientRect();
            initialRight = window.innerWidth - rect.right;
            initialBottom = window.innerHeight - rect.bottom;
            
            document.addEventListener('touchmove', onTouchMove, { passive: false });
            document.addEventListener('touchend', onTouchEnd);
            
            function onTouchMove(e) {
                e.preventDefault();
                const touch = e.touches[0];
                const dx = touch.clientX - startX;
                const dy = touch.clientY - startY;
                
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                    isDragging = true;
                    widget.classList.add('dragging');
                    
                    widget.style.right = (initialRight - dx) + 'px';
                    widget.style.bottom = (initialBottom - dy) + 'px';
                    widget.style.left = 'auto';
                    widget.style.top = 'auto';
                }
            }
            
            function onTouchEnd() {
                widget.classList.remove('dragging');
                document.removeEventListener('touchmove', onTouchMove);
                document.removeEventListener('touchend', onTouchEnd);
                
                const rect = widget.getBoundingClientRect();
                const right = window.innerWidth - rect.right;
                const bottom = window.innerHeight - rect.bottom;
                localStorage.setItem('translator_widget_position', JSON.stringify({ right, bottom }));
            }
        });
        
        // ===== 翻译面板拖动功能 =====
        panelHeader.addEventListener('mousedown', (e) => {
            if (e.target === closeBtn) return; // 如果点击的是关闭按钮，不拖动
            
            isPanelDragging = false;
            panelStartX = e.clientX;
            panelStartY = e.clientY;
            
            const rect = panel.getBoundingClientRect();
            panelInitialRight = window.innerWidth - rect.right;
            panelInitialBottom = window.innerHeight - rect.bottom;
            
            document.addEventListener('mousemove', onPanelMouseMove);
            document.addEventListener('mouseup', onPanelMouseUp);
            
            function onPanelMouseMove(e) {
                const dx = e.clientX - panelStartX;
                const dy = e.clientY - panelStartY;
                
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                    isPanelDragging = true;
                    panel.style.cursor = 'grabbing';
                    
                    panel.style.right = (panelInitialRight - dx) + 'px';
                    panel.style.bottom = (panelInitialBottom - dy) + 'px';
                    panel.style.left = 'auto';
                    panel.style.top = 'auto';
                    panel.style.transformOrigin = 'center center';
                }
            }
            
            function onPanelMouseUp() {
                panel.style.cursor = 'grab';
                document.removeEventListener('mousemove', onPanelMouseMove);
                document.removeEventListener('mouseup', onPanelMouseUp);
                
                const rect = panel.getBoundingClientRect();
                const right = window.innerWidth - rect.right;
                const bottom = window.innerHeight - rect.bottom;
                localStorage.setItem('translator_panel_position', JSON.stringify({ right, bottom }));
            }
        });
        
        // 触摸拖动支持（移动端）
        panelHeader.addEventListener('touchstart', (e) => {
            if (e.target === closeBtn) return;
            
            isPanelDragging = false;
            const touch = e.touches[0];
            panelStartX = touch.clientX;
            panelStartY = touch.clientY;
            
            const rect = panel.getBoundingClientRect();
            panelInitialRight = window.innerWidth - rect.right;
            panelInitialBottom = window.innerHeight - rect.bottom;
            
            document.addEventListener('touchmove', onPanelTouchMove, { passive: false });
            document.addEventListener('touchend', onPanelTouchEnd);
            
            function onPanelTouchMove(e) {
                e.preventDefault();
                const touch = e.touches[0];
                const dx = touch.clientX - panelStartX;
                const dy = touch.clientY - panelStartY;
                
                if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                    isPanelDragging = true;
                    panel.style.right = (panelInitialRight - dx) + 'px';
                    panel.style.bottom = (panelInitialBottom - dy) + 'px';
                    panel.style.left = 'auto';
                    panel.style.top = 'auto';
                    panel.style.transformOrigin = 'center center';
                }
            }
            
            function onPanelTouchEnd() {
                document.removeEventListener('touchmove', onPanelTouchMove);
                document.removeEventListener('touchend', onPanelTouchEnd);
                
                const rect = panel.getBoundingClientRect();
                const right = window.innerWidth - rect.right;
                const bottom = window.innerHeight - rect.bottom;
                localStorage.setItem('translator_panel_position', JSON.stringify({ right, bottom }));
            }
        });
        
        // 恢复保存的位置
        function restoreWidgetPosition() {
            const savedPos = localStorage.getItem('translator_widget_position');
            if (savedPos) {
                try {
                    const pos = JSON.parse(savedPos);
                    widget.style.right = pos.right + 'px';
                    widget.style.bottom = pos.bottom + 'px';
                    widget.style.left = 'auto';
                    widget.style.top = 'auto';
                } catch (e) {
                    console.error('恢复翻译器位置失败:', e);
                }
            }
            
            const savedPanelPos = localStorage.getItem('translator_panel_position');
            if (savedPanelPos) {
                try {
                    const pos = JSON.parse(savedPanelPos);
                    panel.style.right = pos.right + 'px';
                    panel.style.bottom = pos.bottom + 'px';
                    panel.style.left = 'auto';
                    panel.style.top = 'auto';
                } catch (e) {
                    console.error('恢复翻译面板位置失败:', e);
                }
            }
        }
        
        // 页面加载时恢复位置
        restoreWidgetPosition();
        
        // 翻译按钮点击事件
        translateBtn.addEventListener('click', async () => {
            const from = sourceLang.value;
            const to = targetLang.value;
            
            if (from === to) {
                alert('源语言和目标语言不能相同');
                return;
            }
            
            // 禁用按钮
            translateBtn.disabled = true;
            translateBtn.querySelector('.btn-text').style.display = 'none';
            translateBtn.querySelector('.btn-loading').style.display = 'inline';
            
            // 显示进度
            progress.style.display = 'block';
            
            try {
                // 使用新的翻译方法，传递 from 和 to 参数
                await translatePage(from, to);
            } catch (error) {
                console.error('翻译错误:', error);
                alert('翻译失败：' + error.message);
            } finally {
                resetButton();
            }
            
            function resetButton() {
                translateBtn.disabled = false;
                translateBtn.querySelector('.btn-text').style.display = 'inline';
                translateBtn.querySelector('.btn-loading').style.display = 'none';
                progress.style.display = 'none';
                progressFill.style.width = '0%';
                progressText.textContent = '0%';
            }
        });
        
        // 使用 TreeWalker 获取所有可翻译的文本节点
        function getAllTextNodes(root) {
            const textNodes = [];
            const walker = document.createTreeWalker(
                root,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function(node) {
                        // 过滤掉 script、style 等标签内的文本
                        if (node.parentElement?.closest('script, style, noscript')) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        // 过滤空白文本（仅空格/换行）
                        if (node.textContent.trim().length === 0) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        // 不再过滤短文本和翻译小部件，允许翻译所有可见文本
                        return NodeFilter.FILTER_ACCEPT;
                    }
                }
            );
            
            let node;
            while (node = walker.nextNode()) {
                textNodes.push(node);
            }
            
            console.log(`🔍 getAllTextNodes: 找到 ${textNodes.length} 个文本节点`);
            return textNodes;
        }
        
        // 翻译页面所有文本节点
        async function translatePage(from, to) {
            console.log(' 开始翻译页面...');
            console.log('当前源语言:', from, '目标语言:', to);
            
            // 检查语言是否变化，如果变化则清除所有翻译标记
            const lastFrom = localStorage.getItem('translator_last_from');
            const lastTo = localStorage.getItem('translator_last_to');
            
            if (lastFrom !== from || lastTo !== to) {
                console.log('🔄 检测到语言变化，清除所有翻译标记');
                clearAllTranslationMarks();
                // 保存当前语言配置
                localStorage.setItem('translator_last_from', from);
                localStorage.setItem('translator_last_to', to);
            }
            
            // 获取所有可翻译的文本节点
            const textNodes = getAllTextNodes(document.body);
            console.log(`📝 找到 ${textNodes.length} 个可翻译文本节点`);
            
            if (textNodes.length === 0) {
                alert('没有找到可翻译的文本');
                return;
            }
            
            // 检测文本语言
            function detectLanguage(text) {
                // 简单的语言检测：包含中文字符则认为是中文
                const hasChinese = /[\u4e00-\u9fa5]/.test(text);
                return hasChinese ? 'zh' : 'en';
            }
            
            // 过滤需要翻译的节点（长度大于 5 个字符，避免翻译太短的文本，且语言匹配源语言）
            const nodesToTranslate = textNodes.filter(node => {
                const text = node.textContent.trim();
                const nodeLang = detectLanguage(text);
                return node._translated !== true && text.length > 5 && nodeLang === from;
            });
            
            console.log(`🎯 过滤后需要翻译的节点：${nodesToTranslate.length} 个`);
            
            if (nodesToTranslate.length === 0) {
                alert('没有需要翻译的新文本');
                return;
            }
            
            let translatedCount = 0;
            const totalNodes = nodesToTranslate.length;
            
            // 批处理翻译（每 10 个节点一批）
            const batchSize = 10;
            
            for (let i = 0; i < totalNodes; i += batchSize) {
                const batch = nodesToTranslate.slice(i, i + batchSize);
                console.log(`📦 处理批次 [${Math.floor(i/batchSize) + 1}/${Math.ceil(totalNodes/batchSize)}]，包含 ${batch.length} 个节点`);
                
                // 并行处理批次中的所有节点
                const batchPromises = batch.map(async (node) => {
                    const originalText = node.textContent.trim();
                    
                    try {
                        // 检查缓存
                        const cacheKey = `translate_${from}_${to}_${originalText}`;
                        const cachedResult = localStorage.getItem(cacheKey);
                        
                        let translatedText;
                        if (cachedResult) {
                            console.log(`💾 从缓存获取翻译结果: "${originalText.substring(0, 30)}"`);
                            translatedText = cachedResult;
                        } else {
                            // 调用翻译 API
                            translatedText = await callTranslateAPI(originalText, from, to);
                            
                            // 缓存翻译结果（有效期 24 小时）
                            localStorage.setItem(cacheKey, translatedText);
                            console.log(`✅ 翻译并缓存结果: "${originalText.substring(0, 30)}"`);
                        }
                        
                        // 验证翻译结果
                        if (translatedText && translatedText !== originalText && !translatedText.includes(';') && !translatedText.includes('appraise') && !translatedText.includes('authenticate')) {
                            node.textContent = translatedText;
                            node._translated = true;
                            return true;
                        } else {
                            console.warn(`⚠️ 翻译结果异常或与原文相同: "${translatedText || '空'}"`);
                            return false;
                        }
                    } catch (error) {
                        console.error('翻译失败:', originalText.substring(0, 50), error);
                        return false;
                    }
                });
                
                // 等待批次完成
                const results = await Promise.all(batchPromises);
                const batchSuccessCount = results.filter(Boolean).length;
                translatedCount += batchSuccessCount;
                
                // 更新进度
                const percent = Math.round((translatedCount / totalNodes) * 100);
                progressFill.style.width = percent + '%';
                progressText.textContent = percent + '%';
                
                // 每批次之间短暂延迟，避免请求过快
                if (i + batchSize < totalNodes) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            
            // 翻译完成后提示
            setTimeout(() => {
                const successRate = Math.round((translatedCount / totalNodes) * 100);
                alert(`翻译完成！页面已更新，请查看效果。\n\n共翻译 ${translatedCount}/${totalNodes} 个文本节点\n成功率：${successRate}%\n\n提示：部分复杂布局的文本可能需要手动调整。`);
            }, 100);
        }
        
        // 清除所有节点的翻译标记
        function clearAllTranslationMarks() {
            const textNodes = getAllTextNodes(document.body);
            textNodes.forEach(node => {
                if (node._translated === true) {
                    delete node._translated;
                }
            });
            console.log(`✅ 已清除 ${textNodes.length} 个节点的翻译标记`);
        }
        
        // 获取元素的直接文本内容（不包括子元素）
        function getDirectText(element) {
            let text = '';
            const childNodes = element.childNodes;
            
            for (let i = 0; i < childNodes.length; i++) {
                const node = childNodes[i];
                if (node.nodeType === Node.TEXT_NODE) {
                    text += node.textContent;
                }
            }
            
            return text.trim();
        }
        
        // 替换元素中的文本内容
        function replaceTextContent(element, oldText, newText) {
            const childNodes = element.childNodes;
            
            // 尝试 1: 直接匹配并替换文本节点
            for (let i = 0; i < childNodes.length; i++) {
                const node = childNodes[i];
                if (node.nodeType === Node.TEXT_NODE) {
                    const nodeText = node.textContent.trim();
                    // 使用包含关系而不是严格相等，提高匹配成功率
                    if (nodeText === oldText || node.textContent.includes(oldText)) {
                        node.textContent = newText;
                        return true;
                    }
                }
            }
            
            // 尝试 2: 如果元素只有一个文本子节点，直接替换
            if (childNodes.length === 1 && childNodes[0].nodeType === Node.TEXT_NODE) {
                childNodes[0].textContent = newText;
                return true;
            }
            
            // 尝试 3: 如果没有子节点，直接设置 textContent
            if (childNodes.length === 0) {
                element.textContent = newText;
                return true;
            }
            
            // 尝试 4: 使用 innerText 替换（最后的手段）
            console.log(`⚠️ 常规替换失败，使用 innerText 替换："${oldText}" → "${newText}"`);
            element.innerText = newText;
            return true;
        }
        
        // 提取页面文本（保留备用）
        function extractTexts() {
            const texts = [];
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );
            
            let node;
            while (node = walker.nextNode()) {
                const text = node.textContent.trim();
                
                // 排除翻译小部件本身的文本
                if (node.parentNode.closest('#translator-widget')) {
                    continue;
                }
                
                // 排除脚本、样式等
                if (text.length > 2 && 
                    !node.parentNode.closest('script, style, textarea, code, pre') &&
                    !/^\s*$/.test(text)) {
                    texts.push({
                        node: node,
                        text: text
                    });
                }
            }
            
            return texts;
        }
        
        // 调用翻译 API
        async function callTranslateAPI(text, from, to) {
            console.log('📤 发送翻译请求:', { text: text.substring(0, 50), from, to });
            
            // 使用相对路径，前端和后端部署在 Render 同一域名下
            const API_URL = '/api/translate';
            console.log('🔗 调用 API URL:', API_URL);
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    q: text,
                    from: from,
                    to: to
                })
            });
            
            console.log('📥 API 响应状态:', response.status);
            console.log('📥 API 响应头:', response.headers.get('content-type'));
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ API 错误:', errorText);
                throw new Error('翻译 API 调用失败：' + response.status);
            }
            
            const data = await response.json();
            console.log('📦 API 返回完整数据:', data);  // 打印完整对象
            
            let translatedText = null;
            if (data.translatedText) {
                translatedText = data.translatedText;
                console.log('✅ 使用 translatedText 字段');
            } else if (data.success && data.translation) {
                translatedText = data.translation;
                console.log('✅ 使用 translation 字段');
            } else if (data.success && data.result) {
                translatedText = data.result;
                console.log('✅ 使用 result 字段');
            } else {
                console.warn('⚠️ 未识别翻译字段，使用原文本');
                return text;
            }
            
            console.log('✅ 最终翻译文本:', translatedText);
            return translatedText;
        }
        
        // 监听动态内容变化，自动翻译新添加的内容
        function observeDynamicContent() {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // 对新添加的区域重新提取并翻译文本节点
                            const newTextNodes = getAllTextNodes(node);
                            if (newTextNodes.length > 0) {
                                console.log(`🆕 检测到新内容，找到 ${newTextNodes.length} 个可翻译节点`);
                                // 可以选择自动翻译或等待用户操作
                            }
                        }
                    });
                });
            });
            
            observer.observe(document.body, { 
                childList: true, 
                subtree: true 
            });
            
            console.log('✅ 已启动动态内容监听');
        }
        
        // 启动动态内容监听
        observeDynamicContent();
    }
    
    // 创建 widget 引用
    const widget = null;
    
    // 页面加载完成后创建小部件
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createTranslatorWidget);
    } else {
        createTranslatorWidget();
    }
})();
