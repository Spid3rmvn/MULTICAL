const DashboardPage = {
  chart: null,

  init() {
    // Initialize welcome message first
    this.updateWelcomeMessage();
    
    // Initialize chart
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
    Store.subscribe('debts', () => {
        this.updateStats();
        this.renderActivityFeed();
    });
    
    // Wait for next tick to ensure DOM is ready
    requestAnimationFrame(() => {
      this.updateStats();
      this.renderRecentSales();
      this.renderActivityFeed();
      this.renderTopProducts();
    });
    
    // Force immediate update in case Store is already initialized
    if (Store.initialized) {
      this.updateStats();
      this.renderRecentSales();
      this.renderActivityFeed();
      this.renderTopProducts();
    } else {
      // Backup: Force update after Store is definitely ready
      const checkStore = setInterval(() => {
        if (Store.initialized) {
          clearInterval(checkStore);
          this.updateStats();
          this.renderRecentSales();
          this.renderActivityFeed();
          this.renderTopProducts();
        }
      }, 100);
      // Stop checking after 5 seconds
      setTimeout(() => clearInterval(checkStore), 5000);
    }
  },

  updateWelcomeMessage() {
      const welcomeEl = document.getElementById('welcome-message');
      if (welcomeEl) {
          const hour = new Date().getHours();
          let greeting = 'Good Morning';
          if (hour >= 12 && hour < 17) {
              greeting = 'Good Afternoon';
          } else if (hour >= 17) {
              greeting = 'Good Evening';
          }
          // Get username from localStorage or use default
          const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
          const username = currentUser.username || 'Admin';
          welcomeEl.textContent = `${greeting}, ${username}`;
      }
  },

  updateStats() {
    const revenueEl = document.getElementById('stat-revenue');
    const salesEl = document.getElementById('stat-sales');
    const productsEl = document.getElementById('stat-products');
    const debtsEl = document.getElementById('stat-debts');

    // Check if elements exist - if not, retry later
    if (!revenueEl || !salesEl || !productsEl || !debtsEl) {
      setTimeout(() => this.updateStats(), 100);
      return;
    }

    const revenue = Store.getTotalRevenue?.() || 0;
    const salesCount = Store.sales?.length || 0;
    const productsCount = Store.products?.length || 0;
    const outstanding = Store.getTotalOutstanding?.() || 0;

    revenueEl.textContent = `KSh ${revenue.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    salesEl.textContent = salesCount;
    productsEl.textContent = productsCount;
    debtsEl.textContent = `KSh ${outstanding.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  },

  initChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (this.chart) {
        this.chart.destroy();
    }

    // Get last 7 days labels
    const labels = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toLocaleDateString('en-US', { weekday: 'short' });
    });

    // Mock data for the chart (replace with actual logic if needed)
    // For now, we'll generate some realistic looking data based on sales
    const dataPoints = labels.map(() => Math.floor(Math.random() * 5000) + 1000);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Revenue',
          data: dataPoints,
          borderColor: '#000000', // Black line
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)'); // Faint black
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
          legend: {
            display: false
          },
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
                font: {
                    family: 'Inter',
                    size: 11
                },
                callback: function(value) {
                    return 'KSh ' + (value / 1000) + 'k';
                }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
                color: '#9ca3af',
                font: {
                    family: 'Inter',
                    size: 11
                }
            }
          }
        }
      }
    });
  },
  
  updateChart() {
      // In a real app, we would recalculate data based on new sales
      // For now, doing nothing or we could re-render
      if (this.chart) {
          this.chart.update();
      }
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

// Make DashboardPage available globally
window.DashboardPage = DashboardPage;
