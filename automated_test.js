// 排班算法自动化测试脚本
// 运行：node automated_test.js

// 排班算法核心函数
function generateSchedule(employees) {
    const daysOfWeek = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const schedule = [];
    
    // 初始化
    const restDays = assignRestDays(employees.length);
    const morningCount = new Array(employees.length).fill(0);
    const eveningCount = new Array(employees.length).fill(0);
    const previousShift = new Array(employees.length).fill('');
    
    for (let day = 0; day < 7; day++) {
        const daySchedule = {
            dayOfWeek: daysOfWeek[day],
            employees: []
        };
        
        if (employees.length === 2) {
                // 2个员工的特殊处理
                let emp0Shift = '';
                let emp1Shift = '';
                
                if (restDays[0] === day) {
                    emp0Shift = 'rest';
                    emp1Shift = 'full';
                } else if (restDays[1] === day) {
                    emp0Shift = 'full';
                    emp1Shift = 'rest';
                } else {
                    emp0Shift = day > 0 && previousShift[0] !== 'rest' ? previousShift[0] : 'morning';
                    emp1Shift = day > 0 && previousShift[1] !== 'rest' ? previousShift[1] : 'evening';
                    
                    if (emp0Shift === emp1Shift) {
                        emp1Shift = emp1Shift === 'morning' ? 'evening' : 'morning';
                    }
                    
                    // 检查连续3天相同班次
                    if (day >= 2) {
                        if (previousShift[0] === emp0Shift && schedule[day-2].employees[0].shift === emp0Shift) {
                            emp0Shift = emp0Shift === 'morning' ? 'evening' : 'morning';
                            emp1Shift = emp1Shift === 'morning' ? 'evening' : 'morning';
                        } else if (previousShift[1] === emp1Shift && schedule[day-2].employees[1].shift === emp1Shift) {
                            emp1Shift = emp1Shift === 'morning' ? 'evening' : 'morning';
                            emp0Shift = emp0Shift === 'morning' ? 'evening' : 'morning';
                        }
                    }
                }
                
                daySchedule.employees.push({ name: employees[0].name, shift: emp0Shift });
                daySchedule.employees.push({ name: employees[1].name, shift: emp1Shift });
                
                // 更新班次计数器
                if (emp0Shift === 'morning') morningCount[0]++;
                if (emp0Shift === 'evening') eveningCount[0]++;
                if (emp0Shift === 'full') {
                    morningCount[0]++;
                    eveningCount[0]++;
                }
                if (emp1Shift === 'morning') morningCount[1]++;
                if (emp1Shift === 'evening') eveningCount[1]++;
                if (emp1Shift === 'full') {
                    morningCount[1]++;
                    eveningCount[1]++;
                }
                
                // 更新前一天班次记录
                previousShift[0] = emp0Shift;
                previousShift[1] = emp1Shift;
        } else {
            // 多个员工情况
            const shifts = [];
            const workingEmployees = [];
            
            employees.forEach((employee, empIndex) => {
                if (restDays[empIndex] === day) {
                    shifts.push('rest');
                } else {
                    workingEmployees.push(empIndex);
                    shifts.push('');
                }
            });
            
            // 为所有员工分配班次（确保每个人都有排班）
            workingEmployees.forEach(empIndex => {
                if (workingEmployees.length === 1) {
                    shifts[empIndex] = 'full';
                    return;
                }
                
                let shift = '';
                const hasMorning = shifts.some(s => s === 'morning');
                const hasEvening = shifts.some(s => s === 'evening');
                
                if (!hasMorning && !hasEvening) {
                    let minMorningCount = Infinity;
                    let minMorningIndex = -1;
                    workingEmployees.forEach(idx => {
                        if (morningCount[idx] < minMorningCount) {
                            minMorningCount = morningCount[idx];
                            minMorningIndex = idx;
                        }
                    });
                    
                    if (minMorningIndex === empIndex) {
                        shift = 'morning';
                    } else {
                        let minEveningCount = Infinity;
                        let minEveningIndex = -1;
                        workingEmployees.forEach(idx => {
                            if (eveningCount[idx] < minEveningCount) {
                                minEveningCount = eveningCount[idx];
                                minEveningIndex = idx;
                            }
                        });
                        
                        if (minEveningIndex === empIndex) {
                            shift = 'evening';
                        } else {
                            shift = morningCount[empIndex] <= eveningCount[empIndex] ? 'morning' : 'evening';
                        }
                    }
                } else if (!hasMorning) {
                    shift = 'morning';
                } else if (!hasEvening) {
                    shift = 'evening';
                } else {
                    shift = morningCount[empIndex] <= eveningCount[empIndex] ? 'morning' : 'evening';
                }
                
                // 优先延续前一天的有效班次（支持连续排班）
                if (day > 0 && previousShift[empIndex] !== 'rest' && previousShift[empIndex] !== '') {
                    let isConsecutive = false;
                    if (day >= 2) {
                        const day2Shift = schedule[day-2].employees[empIndex].shift;
                        const day1Shift = previousShift[empIndex];
                        if (day2Shift === day1Shift && day1Shift === shift) {
                            isConsecutive = true;
                        }
                    }
                    if (!isConsecutive) {
                        shift = previousShift[empIndex];
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
                
                // 最终确保分配了有效的班次
                if (shift === '') {
                    // 绝对确保不会有空班次 - 最后一道防线
                    shift = morningCount[empIndex] <= eveningCount[empIndex] ? 'morning' : 'evening';
                }
                
                shifts[empIndex] = shift;
            });
            
            // 检查是否会导致连续3天相同班次
            shifts.forEach((shift, empIndex) => {
                if (shift !== 'rest' && day >= 2) {
                    const day2Shift = schedule[day-2].employees[empIndex].shift;
                    const day1Shift = previousShift[empIndex];
                    
                    if (day1Shift === shift && day2Shift === shift) {
                        if (shift === 'morning' && eveningCount[empIndex] < 4) {
                            shifts[empIndex] = 'evening';
                        } else if (shift === 'evening' && morningCount[empIndex] < 4) {
                            shifts[empIndex] = 'morning';
                        } else if (shift === 'morning' || shift === 'evening') {
                            shifts[empIndex] = 'full';
                        }
                    }
                }
            });
            
            // 更新班次计数器和员工统计
            shifts.forEach((shift, empIndex) => {
                if (shift === '') {
                    if (restDays[empIndex] === day) {
                        shifts[empIndex] = 'rest';
                    } else {
                        shifts[empIndex] = morningCount[empIndex] <= eveningCount[empIndex] ? 'morning' : 'evening';
                        if (shifts[empIndex] === 'morning') morningCount[empIndex]++;
                        if (shifts[empIndex] === 'evening') eveningCount[empIndex]++;
                    }
                } else {
                    if (shift === 'morning') morningCount[empIndex]++;
                    if (shift === 'evening') eveningCount[empIndex]++;
                }
                
                daySchedule.employees.push({ name: employees[empIndex].name, shift: shifts[empIndex] });
                previousShift[empIndex] = shifts[empIndex];
            });
        }
        
        schedule.push(daySchedule);
    }
    
    return schedule;
}

function assignRestDays(numEmployees) {
    const restDays = [];
    const days = [0, 1, 2, 3, 4, 5, 6];
    
    if (numEmployees <= 7) {
        const availableDays = [...days];
        for (let i = 0; i < numEmployees; i++) {
            const randomIndex = Math.floor(Math.random() * availableDays.length);
            restDays.push(availableDays[randomIndex]);
            availableDays.splice(randomIndex, 1);
        }
    } else {
        const mustWork = new Array(7).fill(false);
        const dayCounts = new Array(7).fill(0);
        
        for (let i = 0; i < numEmployees; i++) {
            let randomDay;
            let attempts = 0;
            const maxAttempts = 10;
            
            do {
                randomDay = days[Math.floor(Math.random() * days.length)];
                attempts++;
                
                if (i < 7 && !mustWork[randomDay]) {
                    restDays.push(randomDay);
                    mustWork[randomDay] = true;
                    dayCounts[randomDay]++;
                    break;
                }
                
                let isConsecutive = false;
                if (i >= 2) {
                    if (restDays[i-1] === randomDay - 1 && restDays[i-2] === randomDay - 2) {
                        isConsecutive = true;
                    }
                    if (restDays[i-1] === randomDay + 1 && restDays[i-2] === randomDay + 2) {
                        isConsecutive = true;
                    }
                }
                
                if (!isConsecutive || attempts >= maxAttempts) {
                    restDays.push(randomDay);
                    dayCounts[randomDay]++;
                    break;
                }
            } while (true);
        }
    }
    
    // 最终检查：确保每天至少有一名员工工作
    for (let day = 0; day < 7; day++) {
        let hasWorker = false;
        for (let i = 0; i < numEmployees; i++) {
            if (restDays[i] !== day) {
                hasWorker = true;
                break;
            }
        }
        if (!hasWorker) {
            for (let i = 0; i < numEmployees; i++) {
                if (restDays[i] !== day) {
                    let newRestDay;
                    do {
                        newRestDay = days[Math.floor(Math.random() * days.length)];
                    } while (newRestDay === day);
                    restDays[i] = newRestDay;
                    break;
                }
            }
        }
    }
    
    return restDays;
}

// 运行测试
function runTests() {
    console.log('=== 排班算法自动化测试 ===');
    console.log('开始时间:', new Date().toLocaleString());
    console.log('\n');
    
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    const errorDetails = [];
    
    // 测试不同员工数量的情况
    const employeeCounts = [2, 3, 4, 5, 6, 7];
    const iterationsPerCount = 100; // 每种员工数量测试100次
    
    employeeCounts.forEach(count => {
        console.log(`--- 测试 ${count} 名员工 ---`);
        
        for (let iter = 0; iter < iterationsPerCount; iter++) {
            totalTests++;
            
            // 创建员工
            const employees = [];
            for (let i = 0; i < count; i++) {
                employees.push({ name: `员工${i+1}`, shifts: { morning: 0, evening: 0, full: 0, rest: 0 } });
            }
            
            // 生成排班表
            const schedule = generateSchedule(employees);
            
            // 检查是否有员工未排班
            let hasError = false;
            let errorInfo = '';
            
            schedule.forEach((daySchedule, dayIndex) => {
                daySchedule.employees.forEach((empSchedule, empIndex) => {
                    if (!empSchedule.shift) {
                        hasError = true;
                        errorInfo = `测试${totalTests}: 员工${empIndex+1}在${daySchedule.dayOfWeek}没有排班！`;
                    }
                });
            });
            
            // 检查是否有连续3天相同班次
            let hasConsecutiveError = false;
            let consecutiveErrorInfo = '';
            
            for (let empIndex = 0; empIndex < employees.length; empIndex++) {
                for (let day = 2; day < 7; day++) {
                    const day0Shift = schedule[day-2].employees[empIndex].shift;
                    const day1Shift = schedule[day-1].employees[empIndex].shift;
                    const day2Shift = schedule[day].employees[empIndex].shift;
                    
                    if (day0Shift === day1Shift && day1Shift === day2Shift && day0Shift !== 'rest') {
                        hasConsecutiveError = true;
                        consecutiveErrorInfo = `测试${totalTests}: 员工${empIndex+1}在${schedule[day-2].dayOfWeek}、${schedule[day-1].dayOfWeek}、${schedule[day].dayOfWeek}连续3天${day0Shift}！`;
                        break;
                    }
                }
                if (hasConsecutiveError) break;
            }
            
            // 记录测试结果
            if (hasError || hasConsecutiveError) {
                failedTests++;
                const error = hasError ? errorInfo : consecutiveErrorInfo;
                errorDetails.push(error);
                
                if ((iter + 1) % 20 === 0) {
                    process.stdout.write('F');
                }
            } else {
                passedTests++;
                if ((iter + 1) % 20 === 0) {
                    process.stdout.write('.');
                }
            }
        }
        
        console.log('');
        console.log(`${count}名员工测试完成: ${iterationsPerCount}次测试`);
        console.log('\n');
    });
    
    // 显示总结
    console.log('=== 测试总结 ===');
    console.log(`总测试次数: ${totalTests}`);
    console.log(`通过次数: ${passedTests}`);
    console.log(`失败次数: ${failedTests}`);
    console.log(`通过率: ${((passedTests/totalTests)*100).toFixed(2)}%`);
    
    if (failedTests > 0) {
        console.log('\n失败详情:');
        errorDetails.forEach((error, index) => {
            console.log(`${index+1}. ${error}`);
        });
    } else {
        console.log('\n🎉 所有测试都通过了！没有员工未排班的情况！');
    }
    
    console.log('\n结束时间:', new Date().toLocaleString());
    console.log('=== 测试结束 ===');
}

// 开始测试
runTests();