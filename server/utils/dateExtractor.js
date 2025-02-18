/**
 * Utility for extracting and parsing dates from web content
 */
class DateExtractor {
  static async extractFromPage(page, selector) {
    return page.evaluate((selector) => {
      const dateEl = document.querySelector(selector);
      if (!dateEl) return new Date().toISOString();

      // Try different date formats
      const datetime = dateEl.getAttribute('datetime');
      if (datetime) return datetime;

      const dataDate = dateEl.getAttribute('data-date');
      if (dataDate) return dataDate;

      const text = dateEl.textContent.trim();
      const parsed = Date.parse(text);
      return !isNaN(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
    }, selector);
  }
}

module.exports = DateExtractor;
