const DashboardPage = {
  chart: null,
  currentFilter: 'week',

  init() {
    this.bindEvents();
    this.render();
    this.initChart();
    
    // Subscribe to store updates
    Store.subscribe('products', () => {
        this.updateStats();
        this.renderTopProducts();
    });
    Store.subscribe('sales', () => {
        this.updateStats();
        this.updateChart();
        this.renderRecentSales();
        this.renderActivityFeed();
        this.renderTopProducts();
    });
    Store.subscribe('serviceTransactions', () => {
        this.updateStats();
        this.updateChart();
    });
    Store.subscribe('debts', () => {
        this.updateStats();
        this.renderActivityFeed();
    });
    
    // Initialize welcome message
    this.updateWelcomeMessage();
  },

  bindEvents() {
    const btnWeek = document.getElementById('btn-chart-week');
    const btnMonth = document.getElementById('btn-chart-month');
    const btnYear = document.getElementById('btn-chart-year');

    const updateFilter = (filter) => {
      this.currentFilter = filter;
      
      // Update buttons UI
      [btnWeek, btnMonth, btnYear].forEach(btn => {
        if (!btn) return;
        btn.className = 'chart-filter-btn px-3 py-1 text-xs font-medium text-gray-600 rounded-md hover:bg-white hover:shadow-sm transition-all';
      });

      const activeBtn = filter === 'week' ? btnWeek : filter === 'month' ? btnMonth : btnYear;
      if (activeBtn) {
        activeBtn.className = 'chart-filter-btn px-3 py-1 text-xs font-medium text-white bg-black shadow-sm rounded-md transition-all';
      }

      this.updateChart();
    };

    if (btnWeek) btnWeek.addEventListener('click', () => updateFilter('week'));
    if (btnMonth) btnMonth.addEventListener('click', () => updateFilter('month'));
    if (btnYear) btnYear.addEventListener('click', () => updateFilter('year'));
  },

  updateWelcomeMessage() {
      const welcomeEl = document.getElementById('welcome-message');
      if (welcomeEl) {
          const hour = new Date().getHours();
          let greeting = 'Good Morning';
          if (hour >= 12 && hour < 18) {
              greeting = 'Good Afternoon';
          } else if (hour >= 18) {
              greeting = 'Good Evening';
          }
          welcomeEl.textContent = `${greeting}, Admin`;
      }
  },

  render() {
    this.updateStats();
    this.renderRecentSales();
    this.renderActivityFeed();
    this.renderTopProducts();
  },

  updateStats() {
    const revenueEl = document.getElementById('stat-revenue');
    const salesEl = document.getElementById('stat-sales');
    const productsEl = document.getElementById('stat-products');
    const debtsEl = document.getElementById('stat-debts');

    const totalRevenue = Store.getTotalRevenue() + Store.getTotalServiceEarnings();

    if (revenueEl) revenueEl.textContent = `KSh ${totalRevenue.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    if (salesEl) salesEl.textContent = Store.sales.length + Store.serviceTransactions.length;
    if (productsEl) productsEl.textContent = Store.products.length;
    if (debtsEl) debtsEl.textContent = `KSh ${Store.getTotalOutstanding().toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  },

  getChartData() {
    const labels = [];
    const data = [];
    
    // Combine sales and service transactions
    const allTransactions = [
      ...Store.sales.map(s => ({ amount: s.amount, date: new Date(s.timestamp) })),
      ...Store.serviceTransactions.map(t => ({ amount: t.amount, date: new Date(t.timestamp) }))
    ];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (this.currentFilter === 'week') {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        
        const dayTotal = allTransactions.reduce((sum, t) => {
          const tDate = new Date(t.date);
          tDate.setHours(0, 0, 0, 0);
          return tDate.getTime() === d.getTime() ? sum + t.amount : sum;
        }, 0);
        
        data.push(dayTotal);
      }
    } else if (this.currentFilter === 'month') {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        
        labels.push(d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));
        
        const dayTotal = allTransactions.reduce((sum, t) => {
          const tDate = new Date(t.date);
          tDate.setHours(0, 0, 0, 0);
          return tDate.getTime() === d.getTime() ? sum + t.amount : sum;
        }, 0);
        
        data.push(dayTotal);
      }
    } else if (this.currentFilter === 'year') {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today);
        d.setMonth(today.getMonth() - i);
        d.setDate(1); // Normalize to first day of month
        
        labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
        
        const monthTotal = allTransactions.reduce((sum, t) => {
          const tDate = new Date(t.date);
          return (tDate.getMonth() === d.getMonth() && tDate.getFullYear() === d.getFullYear()) 
            ? sum + t.amount : sum;
        }, 0);
        
        data.push(monthTotal);
      }
    }
    
    return { labels, data };
  },

  initChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    if (this.chart) {
        this.chart.destroy();
    }

    const { labels, data } = this.getChartData();

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Revenue',
          data: data,
          borderColor: '#000000',
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)'); 
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            return gradient;
          },
          borderWidth: 2,
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#000000',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#000000',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
                label: function(context) {
                    return `KSh ${context.parsed.y.toLocaleString()}`;
                }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#f3f4f6',
              drawBorder: false
            },
            ticks: {
                color: '#9ca3af',
                font: { family: 'Inter', size: 11 },
                callback: function(value) {
                    return 'KSh ' + (value >= 1000 ? (value / 1000) + 'k' : value);
                }
            }
          },
          x: {
            grid: { display: false },
            ticks: {
                color: '#9ca3af',
                font: { family: 'Inter', size: 11 },
                maxTicksLimit: 7 // Limit labels on x-axis to avoid overcrowding
            }
          }
        }
      }
    });
  },
  
  updateChart() {
    if (!this.chart) return;
    
    const { labels, data } = this.getChartData();
    
    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = data;
    this.chart.update();
  },

  renderRecentSales() {
    const tbody = document.getElementById('dashboard-recent-sales-table');
    if (!tbody) return;

    const recentSales = [...Store.sales].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

    if (recentSales.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="px-6 py-8 text-center text-gray-400 italic">
            No transactions yet
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = recentSales.map(sale => {
        const product = Store.products.find(p => p.id === sale.product_id);
        const productName = sale.product_name || (product ? product.name : 'Unknown Product');
        const date = new Date(sale.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
        
        return `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="font-medium text-gray-900">${productName}</td>
            <td class="text-gray-500">${date}</td>
            <td class="font-medium text-gray-900">KSh ${sale.amount.toLocaleString()}</td>
            <td><span class="status-badge status-badge--success">Completed</span></td>
        </tr>
      `;
    }).join('');
  },

  renderActivityFeed() {
      const container = document.getElementById('dashboard-activity-feed');
      if (!container) return;

      // Combine sales and debts for activity
      const salesActivity = Store.sales.map(s => ({
          type: 'sale',
          date: new Date(s.timestamp),
          data: s
      }));
      
      const debtsActivity = Store.debts.map(d => ({
          type: 'debt',
          date: new Date(d.created_at),
          data: d
      }));

      const allActivity = [...salesActivity, ...debtsActivity]
          .sort((a, b) => b.date - a.date)
          .slice(0, 5);

      if (allActivity.length === 0) {
          container.innerHTML = '<p class="text-center text-gray-400 py-4 italic">No recent activity</p>';
          return;
      }

      container.innerHTML = allActivity.map((item, index) => {
          const isSale = item.type === 'sale';
          const time = item.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          let content = '';

          if (isSale) {
              const product = Store.products.find(p => p.id === item.data.product_id);
              const productName = item.data.product_name || (product ? product.name : 'Item');
              content = `
                <p class="text-sm text-gray-900"><span class="font-semibold">New Sale:</span> ${productName}</p>
                <p class="text-xs text-gray-500 mt-0.5">Sale of KSh ${item.data.amount.toLocaleString()} • ${time}</p>
              `;
          } else {
              content = `
                <p class="text-sm text-gray-900"><span class="font-semibold">Debt Added:</span> ${item.data.customer_name}</p>
                <p class="text-xs text-gray-500 mt-0.5">Amount: KSh ${item.data.amount.toLocaleString()} • ${time}</p>
              `;
          }

          return `
            <div class="activity-item">
                <div class="activity-line"></div>
                <div class="activity-dot ${!isSale ? 'warning' : 'active'}"></div>
                ${content}
            </div>
          `;
      }).join('');
  },

  renderTopProducts() {
      const container = document.getElementById('dashboard-top-products');
      if (!container) return;

      // Calculate top products
      const productSales = {};
      Store.sales.forEach(sale => {
          // Only count product sales, not stock sales
          if (sale.product_id && sale.type === 'product') {
              if (!productSales[sale.product_id]) productSales[sale.product_id] = 0;
              // Parse quantity - it might be a string like "2" or a number
              const qty = typeof sale.quantity === 'string' ? parseFloat(sale.quantity) || 1 : (sale.quantity || 1);
              productSales[sale.product_id] += qty;
          }
      });

      const sortedProducts = Object.entries(productSales)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3);
          
      if (sortedProducts.length === 0) {
           container.innerHTML = '<p class="text-center text-gray-400 py-4 italic">No sales data available</p>';
           return;
      }

      const maxSales = sortedProducts[0][1];

      container.innerHTML = sortedProducts.map(([id, quantity]) => {
          const product = Store.products.find(p => p.id === parseInt(id));
          if (!product) return '';
          
          const percentage = (quantity / maxSales) * 100;
          
          return `
            <div>
                <div class="flex justify-between text-sm mb-1">
                    <span class="font-medium text-gray-900">${product.name}</span>
                    <span class="text-gray-500">${quantity} sold</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-1.5">
                    <div class="bg-black h-1.5 rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>
          `;
      }).join('');
  }
};

// Make globally available
window.DashboardPage = DashboardPage;
