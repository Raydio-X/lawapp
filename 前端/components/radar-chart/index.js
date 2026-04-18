Component({
  properties: {
    dimensions: {
      type: Array,
      value: []
    },
    userData: {
      type: Array,
      value: []
    },
    avgData: {
      type: Array,
      value: []
    }
  },

  data: {},

  lifetimes: {
    attached() {
      this.canvasReady = false;
      this.initCanvas();
    }
  },

  observers: {
    'dimensions, userData, avgData': function () {
      if (this.canvasReady) {
        this.drawChart();
      }
    }
  },

  methods: {
    formatValue(val, dim) {
      if (dim.format === 'hours') {
        if (!val) return { value: '0', unit: 'h' };
        if (val < 60) return { value: val, unit: 'min' };
        return { value: (val / 60).toFixed(1), unit: 'h' };
      }
      if (dim.format === 'minutes') {
        return { value: val || 0, unit: 'min' };
      }
      return { value: val || 0, unit: dim.unit || '' };
    },

    initCanvas() {
      const query = this.createSelectorQuery().in(this);
      query.select('#radarCanvas').fields({
        node: true,
        size: true
      }).exec(res => {
        if (!res[0]) return;

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getWindowInfo().pixelRatio;

        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);

        this.canvas = canvas;
        this.ctx = ctx;
        this.displayWidth = res[0].width;
        this.displayHeight = res[0].height;
        this.canvasReady = true;

        this.drawChart();
      });
    },

    drawChart() {
      if (!this.ctx || !this.data.dimensions.length) return;

      const { dimensions, userData, avgData } = this.data;
      const ctx = this.ctx;
      const w = this.displayWidth;
      const h = this.displayHeight;
      const centerX = w / 2;
      const centerY = h / 2;
      const radius = Math.min(w, h) / 2 - 56;
      const n = dimensions.length;

      ctx.clearRect(0, 0, w, h);

      const maxValues = dimensions.map((dim, i) => {
        const userVal = userData[i] || 0;
        const avgVal = avgData[i] || 0;
        const maxVal = Math.max(userVal, avgVal);
        return Math.max(maxVal * 1.3, dim.min || 1);
      });

      this.drawGrid(ctx, centerX, centerY, radius, n);
      this.drawAxes(ctx, centerX, centerY, radius, n);
      this.drawPolygon(ctx, centerX, centerY, radius, avgData, maxValues, n, 'rgba(255,159,64,0.10)', 'rgba(255,159,64,0.7)', 2);
      this.drawPolygon(ctx, centerX, centerY, radius, userData, maxValues, n, 'rgba(91,143,249,0.10)', 'rgba(91,143,249,0.6)', 2);
      this.drawDataPoints(ctx, centerX, centerY, radius, avgData, maxValues, n, '#FF9500');
      this.drawDataPoints(ctx, centerX, centerY, radius, userData, maxValues, n, '#5B8FF9');
      this.drawLabels(ctx, centerX, centerY, radius, dimensions, userData, avgData, n);
    },

    drawGrid(ctx, centerX, centerY, radius, n) {
      const levels = 4;
      for (let l = 1; l <= levels; l++) {
        const r = (radius * l) / levels;
        ctx.beginPath();
        for (let i = 0; i <= n; i++) {
          const angle = (Math.PI * 2 * (i % n)) / n - Math.PI / 2;
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = l === levels ? '#d0d0d0' : '#e8e8e8';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    },

    drawAxes(ctx, centerX, centerY, radius, n) {
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle));
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    },

    drawPolygon(ctx, centerX, centerY, radius, data, maxValues, n, fillColor, strokeColor, lineWidth) {
      const hasData = data.some(v => v > 0);
      if (!hasData) return;

      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const idx = i % n;
        const angle = (Math.PI * 2 * idx) / n - Math.PI / 2;
        const val = Math.min((data[idx] || 0) / maxValues[idx], 1);
        const r = radius * val;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    },

    drawDataPoints(ctx, centerX, centerY, radius, data, maxValues, n, color) {
      for (let i = 0; i < n; i++) {
        if (!(data[i] > 0)) continue;
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const val = Math.min((data[i] || 0) / maxValues[i], 1);
        const r = radius * val;
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    },

    drawLabels(ctx, centerX, centerY, radius, dimensions, userData, avgData, n) {
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const labelR = radius + 36;
        const x = centerX + labelR * Math.cos(angle);
        const y = centerY + labelR * Math.sin(angle);

        const cosA = Math.cos(angle);
        let textAlign;
        if (Math.abs(cosA) < 0.15) {
          textAlign = 'center';
        } else if (cosA > 0) {
          textAlign = 'left';
        } else {
          textAlign = 'right';
        }

        ctx.textAlign = textAlign;
        ctx.textBaseline = 'bottom';

        ctx.fillStyle = '#555';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(dimensions[i].name, x, y);

        const userFormatted = this.formatValue(userData[i] || 0, dimensions[i]);
        const avgFormatted = this.formatValue(avgData[i] || 0, dimensions[i]);

        ctx.font = 'bold 11px sans-serif';
        ctx.textBaseline = 'top';

        const userText = String(userFormatted.value);
        const slashText = '/';
        const avgText = avgFormatted.value + userFormatted.unit;

        const userWidth = ctx.measureText(userText).width;
        const slashWidth = ctx.measureText(slashText).width;

        let startX;
        if (textAlign === 'center') {
          const totalWidth = userWidth + slashWidth + ctx.measureText(avgText).width;
          startX = x - totalWidth / 2;
        } else if (textAlign === 'right') {
          const totalWidth = userWidth + slashWidth + ctx.measureText(avgText).width;
          startX = x - totalWidth;
        } else {
          startX = x;
        }

        ctx.fillStyle = '#5B8FF9';
        ctx.textAlign = 'left';
        ctx.fillText(userText, startX, y + 2);

        ctx.fillStyle = '#999';
        ctx.fillText(slashText, startX + userWidth, y + 2);

        ctx.fillStyle = '#FF9500';
        ctx.fillText(avgText, startX + userWidth + slashWidth, y + 2);
      }
    }
  }
});