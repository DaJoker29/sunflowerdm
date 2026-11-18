(() => {
  const palette = document.querySelector("#site-search");
  if (!palette) return;

  const bar = document.querySelector(".search-bar");
  const query = document.querySelector("#search-query");
  const status = document.querySelector("#search-status");
  const results = palette.querySelector(".search-results");
  const more = document.querySelector("#search-more");
  const suggestions = palette.querySelector(".search-suggestions");
  const suggestionList = suggestions.querySelector("ul");
  const defaultSuggestions = [...suggestionList.querySelectorAll("[data-search-filter]")]
    .map((button) => [button.dataset.searchFilter, button.querySelector("span").textContent]);
  const portalValues = defaultSuggestions
    .filter(([token]) => token.startsWith("portal:"))
    .map(([token]) => token.slice("portal:".length));
  const searchTypes = ["page", "article", "section", "action"];
  const pageSize = 12;
  let limit = pageSize;
  let entries;
  let pending;

  const normalize = (text) => text.toLowerCase().normalize("NFD")
    .replace(/\p{M}/gu, "").replace(/[’']/g, "").replace(/\s+/g, " ").trim();

  const filterKey = (value) => normalize(value).replace(/[\s-]+/g, "");
  const portalAliases = new Map([
    ["player", "playerportal"], ["players", "playerportal"], ["dm", "dmportal"],
  ]);

  const portalKey = (value) => portalAliases.get(filterKey(value)) ?? filterKey(value);
  const filterToken = /(?:^|\s)(portal|section|series|type|updated):(?:"((?:\\.|[^"\\])*)"(?=\s|$)|([^"\s]*)(?=\s|$)|("(?:\\.|[^"\\])*))/gi;
  const unescapeFilterValue = (value) => value.replace(/\\(["\\])/g, "$1");

  function parseQuery(input) {
    const conditions = [];
    let error = "";
    const text = input.replace(
      filterToken,
      (_, key, quoted, bare, incomplete) => {
        const value = normalize(quoted === undefined ? (bare ?? "") : unescapeFilterValue(quoted));
        if (incomplete || !value) {
          error ||= 'Enter a value after ' + key.toLowerCase() + ': and close any quotes.';
          return " ";
        }
        key = key.toLowerCase();
        switch (key) {
          case "portal": {
            conditions.push((entry) => entry.portal && portalKey(entry.portal) === portalKey(value));
            break;
          }
          case "section":
            conditions.push((entry) => entry.sections.some((item) => filterKey(item.title) === filterKey(value)));
            break;
          case "series": {
            const series = filterKey(value);
            conditions.push((entry) => entry.series && filterKey(entry.series) === series);
            break;
          }
          case "type":
            if (!searchTypes.includes(value)) {
              error ||= "Use " + searchTypes.map((type) => "type:" + type).join(", ") + ".";
            }
            conditions.push((entry) => {
              const kind = normalize(entry.kind);
              return kind === value || (value === "page" && kind === "article");
            });
            break;
          case "updated": {
            const range = dateRange(value);
            if (!range) {
              error ||= "Use updated:30d, updated:YYYY-MM-DD, or updated:YYYY-MM-DD..YYYY-MM-DD.";
            } else {
              conditions.push((entry) => entry.updated >= range[0] && entry.updated <= range[1]);
            }
            break;
          }
        }
        return " ";
      },
    );
    return { phrase: normalize(text), conditions, error };
  }

  function dateRange(value) {
    const days = /^([1-9]\d{0,3})d$/.exec(value);
    if (days) {
      const date = new Date();
      const today = date.toISOString().slice(0, 10);
      date.setUTCDate(date.getUTCDate() - Number(days[1]) + 1);
      return [date.toISOString().slice(0, 10), today];
    }

    const dates = /^(\d{4}-\d{2}-\d{2})(?:\.\.(\d{4}-\d{2}-\d{2}))?$/.exec(value);
    if (!dates) return null;
    const first = dates[1];
    const last = dates[2] ?? first;
    const valid = (day) => {
      const parsed = new Date(day);
      return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day;
    };
    return valid(first) && valid(last) && first <= last ? [first, last] : null;
  }

  function matchRanges(text, pattern) {
    if (!pattern) return [];

    let normalized = "";
    const starts = [];
    const ends = [];
    for (const part of text.matchAll(/\P{M}\p{M}*|\p{M}+/gu)) {
      const value = normalize(part[0]);
      normalized += value || (/\s/u.test(part[0]) ? " " : "");
      while (starts.length < normalized.length) {
        starts.push(part.index);
        ends.push(part.index + part[0].length);
      }
    }

    return Array.from(normalized.matchAll(pattern), (match) => [
      starts[match.index], ends[match.index + match[0].length - 1],
    ]);
  }

  function highlight(element, text, ranges) {
    let offset = 0;
    for (const [start, end] of ranges) {
      element.append(text.slice(offset, start));
      const mark = document.createElement("mark");
      mark.textContent = text.slice(start, end);
      element.append(mark);
      offset = end;
    }
    element.append(text.slice(offset));
  }

  function appendExcerpt(link, body, pattern) {
    const ranges = matchRanges(body, pattern);
    if (!ranges.length) return;

    const [firstStart, firstEnd] = ranges[0];
    const start = Math.max(0, firstStart - 45);
    const end = Math.min(body.length, Math.max(start + 150, firstEnd));
    const excerpt = document.createElement("span");
    excerpt.className = "search-result-excerpt";
    if (start) excerpt.append("…");
    highlight(excerpt, body.slice(start, end), ranges
      .filter(([, finish]) => finish <= end)
      .map(([begin, finish]) => [begin - start, finish - start]));
    if (end < body.length) excerpt.append("…");
    link.append(excerpt);
  }

  async function loadIndex() {
    if (normalize(query.value)) status.textContent = "Loading search…";
    try {
      const response = await fetch(palette.dataset.index);
      if (!response.ok) throw new Error("Search index unavailable");
      entries = (await response.json()).map((entry) => ({
        ...entry,
        normalizedTitle: normalize(entry.title),
        searchable: normalize([entry.title, entry.description, entry.text, entry.portal, entry.series,
          ...entry.sections.map((item) => item.title)].join(" ")),
      }));
      render();
    } catch {
      status.textContent = "Search could not load. Close and reopen to try again.";
    } finally {
      pending = undefined;
    }
  }

  function renderSuggestions() {
    const value = query.value;
    const caret = query.selectionStart ?? value.length;
    const token = [...value.matchAll(/(?:^|\s)([a-z]+(?::(?:"(?:\\.|[^"\\])*"?|[^\s"]*))?)/gi)]
      .find((match) => caret > match.index + match[0].length - match[1].length
        && caret <= match.index + match[0].length);
    let choices = [];
    let start = 0;
    let end = value.length;
    if (!value.trim()) {
      choices = defaultSuggestions;
    } else if (token) {
      end = token.index + token[0].length;
      start = end - token[1].length;
      const prefix = value.slice(start, caret).toLowerCase();
      const colon = prefix.indexOf(":");
      const key = colon < 0 ? prefix : prefix.slice(0, colon);
      const fragment = colon < 0 ? undefined : prefix.slice(colon + 1);
      if (fragment === undefined && key.length >= 2) {
        choices = defaultSuggestions.filter(([example]) => example.startsWith(key));
      } else if (fragment !== undefined) {
        const values = {
          portal: portalValues,
          section: (entries ?? []).flatMap((entry) => entry.sections.map((item) => item.title)),
          series: (entries ?? []).map((entry) => entry.series).filter(Boolean),
          type: searchTypes,
          updated: ["7d", "30d", "90d"],
        };
        const typed = filterKey(unescapeFilterValue(fragment.replace(/^"|"$/g, "")));
        const matches = [...new Set(Object.hasOwn(values, key) ? values[key] : [])]
          .filter((item) => filterKey(item).startsWith(typed));
        choices = matches.map((item) => [key + ":" + (/[\s"\\]/.test(item) ? JSON.stringify(item) : item), ""])
          .filter(([example]) => example.toLowerCase() !== token[1].toLowerCase());
      }
    }

    suggestions.hidden = choices.length === 0;
    suggestionList.replaceChildren(...choices.map(([example, description]) => {
      const row = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      const code = document.createElement("code");
      code.textContent = example;
      button.append(code);
      if (description) {
        const hint = document.createElement("span");
        hint.textContent = description;
        button.append(hint);
      }
      button.addEventListener("click", () => {
        const suffix = query.value.slice(end);
        const needsValue = example.endsWith(":");
        const space = needsValue || /^\s/.test(suffix) ? "" : " ";
        query.value = query.value.slice(0, start) + example + space + suffix;
        query.focus();
        const next = start + example.length + (needsValue ? 0 : 1);
        query.setSelectionRange(next, next);
        refresh();
      });
      row.append(button);
      return row;
    }));
  }

  function render() {
    const { phrase, conditions, error } = parseQuery(query.value);
    renderSuggestions();
    if ((!phrase && !conditions.length) || error) {
      results.replaceChildren();
      status.textContent = error;
      more.hidden = true;
      return;
    }
    if (!entries) return;

    const words = phrase ? phrase.split(" ") : [];
    const alternatives = [...new Set(words)].sort((a, b) => b.length - a.length)
      .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const pattern = alternatives.length ? new RegExp(alternatives.join("|"), "g") : null;
    const ranked = [];

    for (const entry of entries) {
      if (!conditions.every((condition) => condition(entry))) continue;
      if (!words.every((word) => entry.searchable.includes(word))) continue;

      let score = entry.kind === "Action" ? 1 : 0;
      if (phrase && entry.normalizedTitle === phrase) score += 100;
      else if (phrase && entry.normalizedTitle.includes(phrase)) score += 50;
      else if (words.length && words.every((word) => entry.normalizedTitle.includes(word))) score += 20;
      ranked.push({ entry, score });
    }

    ranked.sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));
    const urls = new Set();
    const matches = ranked.filter(({ entry }) => {
      if (urls.has(entry.url)) return false;
      urls.add(entry.url);
      return true;
    });
    const shown = matches.slice(0, limit);
    results.replaceChildren(...shown.map(({ entry }) => {
      const row = document.createElement("li");
      const link = document.createElement("a");
      link.href = entry.url;
      const title = document.createElement("strong");
      highlight(title, entry.title, matchRanges(entry.title, pattern));
      const context = document.createElement("span");
      context.className = "search-result-context";
      const contextText = [entry.kind, entry.portal, ...entry.sections.map((item) => item.title), entry.series]
        .filter((part) => part && part !== entry.title).join(" · ");
      highlight(context, contextText, matchRanges(contextText, pattern));
      link.append(title, context);
      if (entry.description) {
        const description = document.createElement("span");
        highlight(description, entry.description, matchRanges(entry.description, pattern));
        link.append(description);
      }
      const previewText = normalize([entry.title, contextText, entry.description].join(" "));
      if (entry.kind !== "Action" && words.some((word) => !previewText.includes(word))) {
        appendExcerpt(link, entry.text.replace(/\s+/g, " ").trim(), pattern);
      }
      row.append(link);
      return row;
    }));

    status.textContent = matches.length
      ? `Showing ${shown.length} of ${matches.length} ${matches.length === 1 ? "result" : "results"}`
      : "No matches. Try different words or filters.";
    more.hidden = shown.length === matches.length;
  }

  function refresh() {
    limit = pageSize;
    render();
  }

  function openPalette() {
    palette.hidden = false;
    if (!entries && !pending) pending = loadIndex();
  }

  function closePalette() {
    palette.hidden = true;
  }

  function activateSearch() {
    openPalette();
    renderSuggestions();
  }

  query.addEventListener("focus", activateSearch);
  query.addEventListener("click", activateSearch);
  query.addEventListener("keyup", (event) => {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) renderSuggestions();
  });
  query.addEventListener("input", () => {
    openPalette();
    refresh();
  });

  document.addEventListener("click", (event) => {
    if (!event.composedPath().includes(bar)) closePalette();
  });

  bar.addEventListener("focusout", (event) => {
    if (event.relatedTarget && !bar.contains(event.relatedTarget)) closePalette();
  });

  more.addEventListener("click", () => {
    const firstNew = limit;
    limit += pageSize;
    render();
    results.querySelectorAll("a")[firstNew]?.focus();
  });

  bar.addEventListener("keydown", (event) => {
    if (event.isComposing) return;
    if (event.key === "Escape" && !palette.hidden) {
      event.preventDefault();
      query.focus();
      closePalette();
      return;
    }
    if (event.target === query && palette.hidden && event.key === "ArrowDown") {
      event.preventDefault();
      activateSearch();
      return;
    }
    if (palette.hidden) return;
    const links = [...suggestionList.querySelectorAll("button"), ...results.querySelectorAll("a")];
    if (!links.length) return;
    const active = links.indexOf(document.activeElement);
    if (event.target === query && event.key === "Enter") {
      event.preventDefault();
      links[0].click();
    }
    if (event.target !== query && active < 0) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (event.key === "ArrowUp" && active === 0) {
        query.focus();
        return;
      }
      const next = active < 0 ? (event.key === "ArrowDown" ? 0 : links.length - 1)
        : active + (event.key === "ArrowDown" ? 1 : -1);
      links[Math.min(next, links.length - 1)].focus();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey) && !event.altKey) {
      event.preventDefault();
      query.focus();
      query.select();
      activateSearch();
    }
  });
  bar.querySelector("kbd").textContent = /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K";
  query.disabled = false;
})();
