const Export = (() => {
    function toMarkdown(html) {
        if (!html) return '';
        return html
            .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
            .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
            .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
            .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
            .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
            .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
            .replace(/<u[^>]*>(.*?)<\/u>/gi, '__$1__')
            .replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')
            .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
            .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
            .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)')
            .replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)')
            .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n')
            .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<hr\s*\/?>/gi, '\n---\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&nbsp;/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }

    function toPlainText(html) {
        if (!html) return '';
        return html
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&nbsp;/g, ' ')
            .trim();
    }

    function downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function exportMarkdown(title, html) {
        const md = `# ${title}\n\n${toMarkdown(html)}`;
        downloadFile(md, (title || 'untitled') + '.md', 'text/markdown');
    }

    function exportText(title, html) {
        const txt = `${title}\n\n${toPlainText(html)}`;
        downloadFile(txt, (title || 'untitled') + '.txt', 'text/plain');
    }

    function exportPDF(title, html) {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: 'Georgia', serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.8; color: #1a1a1a; }
                    h1 { font-size: 2em; margin-bottom: 0.5em; }
                    h2 { font-size: 1.5em; margin-top: 1.5em; }
                    h3 { font-size: 1.2em; }
                    code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
                    pre { background: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto; }
                    blockquote { border-left: 4px solid #8b5cf6; margin: 0; padding-left: 16px; color: #555; }
                    img { max-width: 100%; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                ${html}
                <hr>
                <small>Exported from Limo.ai</small>
            </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    }

    return { exportMarkdown, exportText, exportPDF, toMarkdown, toPlainText };
})();
