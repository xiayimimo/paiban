Page({
  data: {
    employees: [],
    schedule: []
  },

  onLoad() {
    // 初始化员工数据
    this.setData({
      employees: [
        {
          id: 1,
          name: '张三',
          shifts: {
            morning: 0,
            evening: 0,
            full: 0,
            rest: 0
          }
        },
        {
          id: 2,
          name: '李四',
          shifts: {
            morning: 0,
            evening: 0,
            full: 0,
            rest: 0
          }
        }
      ]
    });
  },

  onEmployeeInput(e) {
    const index = e.currentTarget.dataset.index;
    const value = e.detail.value;
    const employees = this.data.employees;
    employees[index].name = value;
    this.setData({ employees });
  },

  generateSchedule() {
    const employees = [...this.data.employees];
    const daysOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const schedule = [];
    
    // 生成本周的日期
    const today = new Date();
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay());
    
    // 为每个员工分配休息天
    const restDays = this.assignRestDays(employees.length);
    
    // 初始化班次计数器，用于平衡分配
    const morningCount = new Array(employees.length).fill(0);
    const eveningCount = new Array(employees.length).fill(0);
    
    // 重置员工班次统计
    employees.forEach(employee => {
      employee.shifts = {
        morning: 0,
        evening: 0,
        full: 0,
        rest: 0
      };
    });
    
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(firstDayOfWeek);
      currentDate.setDate(firstDayOfWeek.getDate() + day);
      
      const daySchedule = {
        date: this.formatDate(currentDate),
        dayOfWeek: daysOfWeek[currentDate.getDay()],
        employees: []
      };
      
      // 2个员工的特殊处理
      if (employees.length === 2) {
        // 检查是否有员工休息
        if (restDays[0] === day) {
          // 员工0休息，员工1上全班
          daySchedule.employees.push({
            name: employees[0].name,
            shift: 'rest'
          });
          daySchedule.employees.push({
            name: employees[1].name,
            shift: 'full'
          });
          
          employees[0].shifts.rest++;
          employees[1].shifts.full++;
          morningCount[1]++;
          eveningCount[1]++;
        } else if (restDays[1] === day) {
          // 员工1休息，员工0上全班
          daySchedule.employees.push({
            name: employees[0].name,
            shift: 'full'
          });
          daySchedule.employees.push({
            name: employees[1].name,
            shift: 'rest'
          });
          
          employees[0].shifts.full++;
          employees[1].shifts.rest++;
          morningCount[0]++;
          eveningCount[0]++;
        } else {
          // 都不休息，必须分配一人早班一人晚班
          // 计算早班数量差异
          const morningDiff = morningCount[0] - morningCount[1];
          
          // 优先让早班少的员工上早班
          if (morningDiff > 0) {
            // 员工0早班多，让员工1上早班
            daySchedule.employees.push({
              name: employees[0].name,
              shift: 'evening'
            });
            daySchedule.employees.push({
              name: employees[1].name,
              shift: 'morning'
            });
            
            employees[0].shifts.evening++;
            employees[1].shifts.morning++;
            eveningCount[0]++;
            morningCount[1]++;
          } else if (morningDiff < 0) {
            // 员工1早班多，让员工0上早班
            daySchedule.employees.push({
              name: employees[0].name,
              shift: 'morning'
            });
            daySchedule.employees.push({
              name: employees[1].name,
              shift: 'evening'
            });
            
            employees[0].shifts.morning++;
            employees[1].shifts.evening++;
            morningCount[0]++;
            eveningCount[1]++;
          } else {
            // 早班数量相同，比较晚班数量
            const eveningDiff = eveningCount[0] - eveningCount[1];
            
            if (eveningDiff > 0) {
              // 员工0晚班多，让员工1上晚班
              daySchedule.employees.push({
                name: employees[0].name,
                shift: 'morning'
              });
              daySchedule.employees.push({
                name: employees[1].name,
                shift: 'evening'
              });
              
              employees[0].shifts.morning++;
              employees[1].shifts.evening++;
              morningCount[0]++;
              eveningCount[1]++;
            } else if (eveningDiff < 0) {
              // 员工1晚班多，让员工0上晚班
              daySchedule.employees.push({
                name: employees[0].name,
                shift: 'evening'
              });
              daySchedule.employees.push({
                name: employees[1].name,
                shift: 'morning'
              });
              
              employees[0].shifts.evening++;
              employees[1].shifts.morning++;
              eveningCount[0]++;
              morningCount[1]++;
            } else {
              // 都相同，按日期轮换
              if (day % 2 === 0) {
                // 偶数天：员工0早班，员工1晚班
                daySchedule.employees.push({
                  name: employees[0].name,
                  shift: 'morning'
                });
                daySchedule.employees.push({
                  name: employees[1].name,
                  shift: 'evening'
                });
                
                employees[0].shifts.morning++;
                employees[1].shifts.evening++;
                morningCount[0]++;
                eveningCount[1]++;
              } else {
                // 奇数天：员工0晚班，员工1早班
                daySchedule.employees.push({
                  name: employees[0].name,
                  shift: 'evening'
                });
                daySchedule.employees.push({
                  name: employees[1].name,
                  shift: 'morning'
                });
                
                employees[0].shifts.evening++;
                employees[1].shifts.morning++;
                eveningCount[0]++;
                morningCount[1]++;
              }
            }
          }
        }
      } else {
        // 多个员工情况
        const shifts = [];
        const workingEmployees = [];
        
        // 收集今天不休息的员工
        employees.forEach((employee, empIndex) => {
          if (restDays[empIndex] === day) {
            shifts.push('rest');
          } else {
            workingEmployees.push(empIndex);
            shifts.push('');
          }
        });
        
        // 如果有员工工作
        if (workingEmployees.length > 0) {
          // 只有一名员工工作时，分配全班
          if (workingEmployees.length === 1) {
            const empIndex = workingEmployees[0];
            shifts[empIndex] = 'full';
          } else {
            // 确保至少有一名员工上早班，至少有一名员工上晚班
            // 找出早班最少的员工
            let minMorningIndex = workingEmployees[0];
            workingEmployees.forEach(empIndex => {
              if (morningCount[empIndex] < morningCount[minMorningIndex]) {
                minMorningIndex = empIndex;
              }
            });
            
            // 找出晚班最少的员工
            let minEveningIndex = workingEmployees[0];
            workingEmployees.forEach(empIndex => {
              if (eveningCount[empIndex] < eveningCount[minEveningIndex]) {
                minEveningIndex = empIndex;
              }
            });
            
            // 如果早班和晚班最少的是同一个人，选择另一个人
            if (minMorningIndex === minEveningIndex && workingEmployees.length > 1) {
              // 选择另一个晚班最少的员工
              minEveningIndex = workingEmployees.find(empIndex => empIndex !== minMorningIndex);
              // 再次确认晚班数量
              workingEmployees.forEach(empIndex => {
                if (empIndex !== minMorningIndex && 
                    eveningCount[empIndex] < eveningCount[minEveningIndex]) {
                  minEveningIndex = empIndex;
                }
              });
            }
            
            // 分配早班和晚班
            shifts[minMorningIndex] = 'morning';
            shifts[minEveningIndex] = 'evening';
            
            // 为剩余的员工分配班次
            workingEmployees.forEach(empIndex => {
              if (shifts[empIndex] === '') {
                let shift = '';
                
                // 当前员工不休息，分配班次
                if (morningCount[empIndex] <= eveningCount[empIndex]) {
                  // 早班数量少于晚班，优先分配早班
                  shift = 'morning';
                } else if (eveningCount[empIndex] < morningCount[empIndex]) {
                  // 晚班数量少于早班，优先分配晚班
                  shift = 'evening';
                } else {
                  // 早班和晚班数量相同，轮流分配
                  if ((day + empIndex) % 2 === 0) {
                    shift = 'morning';
                  } else {
                    shift = 'evening';
                  }
                }
                
                // 限制每个员工的早班和晚班数量不超过4天
                if (shift === 'morning' && morningCount[empIndex] >= 4) {
                  shift = 'evening';
                } else if (shift === 'evening' && eveningCount[empIndex] >= 4) {
                  shift = 'morning';
                }
                
                // 如果早班和晚班都已经满了，分配全班
                if ((shift === 'morning' && morningCount[empIndex] >= 4) || 
                    (shift === 'evening' && eveningCount[empIndex] >= 4)) {
                  shift = 'full';
                }
                
                shifts[empIndex] = shift;
              }
            });
          }
        }
        
        // 更新班次计数器和员工统计
        shifts.forEach((shift, empIndex) => {
          if (shift === 'morning') morningCount[empIndex]++;
          if (shift === 'evening') eveningCount[empIndex]++;
          
          employees[empIndex].shifts[shift]++;
          daySchedule.employees.push({
            name: employees[empIndex].name,
            shift: shift
          });
        });
      }
      
      schedule.push(daySchedule);
    }
    
    this.setData({
      schedule,
      employees
    });
  },

  assignRestDays(numEmployees) {
    const restDays = [];
    const availableDays = [0, 1, 2, 3, 4, 5, 6];
    
    for (let i = 0; i < numEmployees; i++) {
      const randomIndex = Math.floor(Math.random() * availableDays.length);
      restDays.push(availableDays[randomIndex]);
      availableDays.splice(randomIndex, 1);
    }
    
    return restDays;
  },

  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  getShiftText(shift) {
    switch(shift) {
      case 'morning': return '早班';
      case 'evening': return '晚班';
      case 'full': return '全班';
      case 'rest': return '休息';
      default: return '';
    }
  },

  saveTableAsImage() {
    wx.canvasToTempFilePath({
      canvasId: 'scheduleCanvas',
      success: function(res) {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: function() {
            wx.showToast({
              title: '保存成功',
              icon: 'success'
            });
          },
          fail: function(err) {
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            });
            console.error(err);
          }
        });
      },
      fail: function(err) {
        wx.showToast({
          title: '生成图片失败',
          icon: 'none'
        });
        console.error(err);
      }
    }, this);
  }
})