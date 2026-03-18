import * as echarts from 'echarts';

interface Output {
  name: string;
  url: string;
}

interface TimelineEntry {
  date: string;
  lang: string;
  outputs: Output[];
  path: string;
  section: string[];
  summary: string;
  tags: string[];
  title: string;
  url: string;
}

export type Tags = {
  [key: string]: {
    count: string;
    sameAs: URL;
    posts: string[];
    url: string;
    translations?: { [key: string]: string };
  };
};

export class TimelineVisualizer {
  private chart: echarts.ECharts;
  private entries: TimelineEntry[] = [];
  private tags: Tags = {};
  private domElement: HTMLElement;
  private filteredEntries: TimelineEntry[] = [];
  private currentTags: string[] = [];
  public defaultSection: string = '/post';
  private minDate: number = 0;
  private maxDate: number = 0;
  private tooltip: HTMLElement;

  constructor(elementId: string, url?: string, tags?: string) {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id ${elementId} not found`);
    }
    this.domElement = element;
    this.domElement.style.height = "800px";
    this.domElement.style.width = "100%";
    this.chart = echarts.init(this.domElement);

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'echarts-tooltip';
    this.tooltip.style.position = 'absolute';
    this.tooltip.style.display = 'none';
    this.tooltip.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    this.tooltip.style.padding = '5px';
    this.tooltip.style.border = '1px solid #ccc';
    this.tooltip.style.pointerEvents = 'none';
    this.tooltip.style.zIndex = '9999';
    document.body.appendChild(this.tooltip);

    if (url) {
      this.load(url);
    }
    if (tags) {
      this.loadTags(tags);
    }


    window.addEventListener('resize', () => {
      this.chart.resize();
    });

  }

  public async load(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      this.entries = await response.json();
      this.updateChart();
    } catch (error) {
      console.error(error);
    }
  }

  public async loadTags(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      this.tags = await response.json();
      console.log("Loaded tags:", this.tags);
    } catch (error) {
      console.error(error);
    }
  }

  public getTranslation(tag: string, lang: string): string {
    if (this.tags === undefined) return tag;
    const tagInfo = this.tags[tag];
    if (!tagInfo) return tag;

    if (tagInfo.translations && tagInfo.translations[lang]) {
      return tagInfo.translations[lang];
    }

    return tag;
  }

  private updateChart(sectionFilter: string = this.defaultSection): void {
    this.filteredEntries = this.entries.filter(e => e.section && e.section.includes(sectionFilter));

    if (this.filteredEntries.length === 0) {
      this.chart.setOption({ series: [] }, true);
      return;
    }

    const dates = this.filteredEntries.map(e => new Date(e.date).getTime());
    let minDate = Math.min(...dates);
    let maxDate = Math.max(...dates);

    // Pad to year boundaries
    const minD = new Date(minDate);
    minD.setMonth(0, 1);
    minD.setHours(0, 0, 0, 0);
    this.minDate = minD.getTime();

    const maxD = new Date(maxDate);
    maxD.setFullYear(maxD.getFullYear() + 1);
    maxD.setMonth(0, 1);
    maxD.setHours(0, 0, 0, 0);
    this.maxDate = maxD.getTime();

    // Collect all unique tags from filtered entries
    const tagsSet = new Set<string>();
    this.filteredEntries.forEach(entry => {
      if (entry.tags) {
        entry.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    this.currentTags = Array.from(tagsSet).sort();

    const series = this.currentTags.map(tag => ({
      name: tag,
      type: 'line',
      data: []
    }));

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'none'
      },
      legend: {
        data: this.currentTags,
        type: 'scroll',
        orient: 'horizontal',
        bottom: 10
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'time',
        boundaryGap: false,
        min: this.minDate,
        max: this.maxDate
      },
      yAxis: {
        type: 'value',
        max: 'dataMax'
      },
      dataZoom: [
        {
          type: 'slider',
          show: true,
          xAxisIndex: [0],
          start: 0,
          end: 100,
          bottom: 40
        },
        {
          type: 'inside',
          xAxisIndex: [0]
        }
      ],
      series: series as any
    };

    this.chart.setOption(option, true); // true = notMerge (reset)
    this.chart.off('dataZoom');
    this.chart.on('dataZoom', () => this.updateSeriesData());

    this.chart.off('mouseover');
    this.chart.on('mouseover', (params: any) => {
      if (params.componentType === 'series') {
        this.tooltip.innerHTML = `<strong>${params.seriesName}</strong>`;
        this.tooltip.style.display = 'block';
        if (params.event && params.event.event) {
          const e = params.event.event;
          this.tooltip.style.left = (e.pageX + 15) + 'px';
          this.tooltip.style.top = (e.pageY + 15) + 'px';
        }
      }
    });

    this.chart.off('mousemove');
    this.chart.on('mousemove', (params: any) => {
      if (params.componentType === 'series') {
        if (params.event && params.event.event) {
          const e = params.event.event;
          this.tooltip.style.left = (e.pageX + 15) + 'px';
          this.tooltip.style.top = (e.pageY + 15) + 'px';
        }
      }
    });

    this.chart.off('mouseout');
    this.chart.on('mouseout', () => {
      this.tooltip.style.display = 'none';
    });

    this.updateSeriesData();
  }

  private updateSeriesData(): void {
    if (this.filteredEntries.length === 0) return;

    const option = this.chart.getOption() as any;
    if (!option.dataZoom || !option.dataZoom[0]) return;

    const start = option.dataZoom[0].start;
    const end = option.dataZoom[0].end;

    const range = this.maxDate - this.minDate;
    const currentRange = range * (end - start) / 100;
    const viewStart = this.minDate + range * start / 100;
    const viewEnd = this.minDate + range * end / 100;

    const yearMillis = 365 * 24 * 3600 * 1000;
    const monthMillis = 30 * 24 * 3600 * 1000;

    let granularity: 'year' | 'quarter' | 'month' | 'day' = 'day';
    if (currentRange > 10 * yearMillis) granularity = 'year';
    else if (currentRange > 1 * yearMillis) granularity = 'quarter';
    else if (currentRange > 6 * monthMillis) granularity = 'month';

    // Generate buckets
    const buckets: number[] = [];
    let current = viewStart;
    const d = new Date(current);
    if (granularity === 'year') {
      d.setFullYear(d.getFullYear() - 1);
      d.setMonth(0, 1);
      d.setHours(0, 0, 0, 0);
    } else if (granularity === 'quarter') {
      d.setMonth(d.getMonth() - 3);
      d.setMonth(Math.floor(d.getMonth() / 3) * 3, 1);
      d.setHours(0, 0, 0, 0);
    } else if (granularity === 'month') {
      d.setMonth(d.getMonth() - 1);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
    } else {
      d.setDate(d.getDate() - 1);
      d.setHours(0, 0, 0, 0);
    }
    current = d.getTime();

    while (current <= viewEnd) {
      buckets.push(current);
      if (granularity === 'year') {
        d.setFullYear(d.getFullYear() + 1);
      } else if (granularity === 'quarter') {
        d.setMonth(d.getMonth() + 3);
      } else if (granularity === 'month') {
        d.setMonth(d.getMonth() + 1);
      } else {
        d.setDate(d.getDate() + 1);
      }
      current = d.getTime();
    }
    buckets.push(current);

    const tagCounts = new Map<string, number>();

    this.filteredEntries.forEach(entry => {
      if (!entry.date || !entry.tags) return;
      const date = new Date(entry.date);
      let keyDate: number;

      if (granularity === 'year') {
        keyDate = new Date(date.getFullYear(), 0, 1).getTime();
      } else if (granularity === 'quarter') {
        keyDate = new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1).getTime();
      } else if (granularity === 'month') {
        keyDate = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      } else {
        keyDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      }

      entry.tags.forEach(tag => {
        const tagIndex = this.currentTags.indexOf(tag);
        if (tagIndex === -1) return;

        const key = `${tagIndex}_${keyDate}`;
        tagCounts.set(key, (tagCounts.get(key) || 0) + 1);
      });
    });

    const series = this.currentTags.map((tag, index) => {
      const data = buckets.map(time => {
        const key = `${index}_${time}`;
        return [time, tagCounts.get(key) || 0];
      });

      return {
        name: tag,
        type: 'line',
        stack: 'Total',
        areaStyle: {},
        emphasis: {
          focus: 'series'
        },
        data: data,
        symbol: 'none',
        smooth: true
      };
    });

    this.chart.setOption({
      series: series
    });
  }
}
