// 测试脚本：验证排班修复是否有效

// 模拟浏览器的Date对象
const today = new Date();
const firstDayOfWeek = new Date(today);
if (today.getDay() === 0) {
    firstDayOfWeek.setDate(today.getDate() - 6);
} else {
    firstDayOfWeek.setDate(today.getDate() - (today.getDay() - 1));
}

// 模拟员工数据
const employees = [
    { id: 1, name: '张三', shifts: { morning: 0, evening: 0, full: 0, rest: 0 } },
    { id: 2, name: '李四', shifts: { morning: 0, evening: 0, full: 0, rest: 0 } },
    { id: 3, name: '王五', shifts: { morning: 0, evening: 0, full: 0, rest: 0 } },
    { id: 4, name: '赵六', shifts: { morning: 0, evening: 0, full: 0, rest: 0 } }
];

// 休息天分配函数（从index.html复制）
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
                    if (restDays[i-1] === randomDay - 1 && restDays[i-2] === randomDay - 2) isConsecutive = true;
                    if (restDays[i-1] === randomDay + 1 && restDays[i-2] === randomDay + 2) isConsecutive = true;
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
    const workingDays = new Array(7).fill(false);
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

// 模拟多个员工的排班逻辑（从index.html复制并简化）
function testScheduleGeneration() {
    const daysOfWeek = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const schedule = [];
    const restDays = assignRestDays(employees.length);
    const morningCount = new Array(employees.length).fill(0);
    const eveningCount = new Array(employees.length).fill(0);
    const previousShift = new Array(employees.length).fill('');
    
    console.log('休息天分配:', restDays.map((rd, i) => `${employees[i].name}: ${daysOfWeek[rd]}`));
    console.log('\n开始生成排班...');
    
    for (let day = 0; day < 7; day++) {
        console.log(`\n${daysOfWeek[day]}:`);
        
        const daySchedule = {
            dayOfWeek: daysOfWeek[day],
            employees: []
        };
        
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
        
        console.log('  工作员工:', workingEmployees.map(idx => employees[idx].name));
        
        // 为所有员工分配班次
        workingEmployees.forEach(empIndex => {
            if (workingEmployees.length === 1) {
                shifts[empIndex] = 'full';
                return;
            }
            
            let shift = '';
            const hasMorning = shifts.some(s => s === 'morning');
            const hasEvening = shifts.some(s => s === 'evening');
            
            if (!hasMorning && !hasEvening) {
                let minMorningIndex = workingEmployees.reduce((minIdx, idx) => 
                    morningCount[idx] < morningCount[minIdx] ? idx : minIdx
                , empIndex);
                
                if (minMorningIndex === empIndex) {
                    shift = 'morning';
                } else {
                    let minEveningIndex = workingEmployees.reduce((minIdx, idx) => 
                        eveningCount[idx] < eveningCount[minIdx] ? idx : minIdx
                    , empIndex);
                    
                    if (minEveningIndex === empIndex) {
                        shift = 'evening';
                    }
                }
            } else if (!hasMorning) {
                shift = 'morning';
            } else if (!hasEvening) {
                shift = 'evening';
            }
            
            if (shift === '') {
                if (day > 0 && previousShift[empIndex] !== 'rest' && previousShift[empIndex] !== '') {
                    shift = previousShift[empIndex];
                } else if (morningCount[empIndex] <= eveningCount[empIndex] + 1) {
                    shift = 'morning';
                } else {
                    shift = 'evening';
                }
            }
            
            if (shift === 'morning' && morningCount[empIndex] >= 4) {
                shift = 'evening';
            } else if (shift === 'evening' && eveningCount[empIndex] >= 4) {
                shift = 'morning';
            }
            
            if ((shift === 'morning' && morningCount[empIndex] >= 4) || 
                (shift === 'evening' && eveningCount[empIndex] >= 4)) {
                shift = 'full';
            }
            
            if (shift === '') {
                shift = Math.random() > 0.5 ? 'morning' : 'evening';
            }
            
            shifts[empIndex] = shift;
        });
        
        // 检查连续3天相同班次
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
        
        // 更新班次计数器和员工统计（修复后的逻辑）
        shifts.forEach((shift, empIndex) => {
            console.log(`  ${employees[empIndex].name}: ${shift}`);
            
            // 确保所有员工都有有效的班次
            if (shift === '') {
                console.log(`  ERROR: ${employees[empIndex].name}没有被分配班次！`);
                // 如果没有分配班次，检查该员工是否应该休息
                if (restDays[empIndex] === day) {
                    // 确实应该休息
                    shifts[empIndex] = 'rest';
                    employees[empIndex].shifts.rest++;
                    console.log(`  修正为休息`);
                } else {
                    // 不应该休息，必须分配一个工作班次
                    if (morningCount[empIndex] <= eveningCount[empIndex]) {
                        shifts[empIndex] = 'morning';
                        morningCount[empIndex]++;
                    } else {
                        shifts[empIndex] = 'evening';
                        eveningCount[empIndex]++;
                    }
                    employees[empIndex].shifts[shifts[empIndex]]++;
                    console.log(`  修正为${shifts[empIndex]}`);
                }
            } else {
                if (shift === 'morning') morningCount[empIndex]++;
                if (shift === 'evening') eveningCount[empIndex]++;
                
                employees[empIndex].shifts[shift]++;
            }
            
            daySchedule.employees.push({ name: employees[empIndex].name, shift: shifts[empIndex] });
            previousShift[empIndex] = shifts[empIndex];
        });
        
        schedule.push(daySchedule);
    }
    
    console.log('\n排班统计:');
    employees.forEach(employee => {
        console.log(`${employee.name}:`);
        console.log(`  早班: ${employee.shifts.morning}`);
        console.log(`  晚班: ${employee.shifts.evening}`);
        console.log(`  全班: ${employee.shifts.full}`);
        console.log(`  休息: ${employee.shifts.rest}`);
        console.log(`  总计: ${employee.shifts.morning + employee.shifts.evening + employee.shifts.full}`);
    });
    
    // 检查是否有员工在某一天没有排班
    let hasError = false;
    schedule.forEach((daySchedule, day) => {
        daySchedule.employees.forEach((empSchedule, empIndex) => {
            if (!empSchedule.shift) {
                console.log(`\nERROR: ${empSchedule.name}在${daySchedule.dayOfWeek}没有排班！`);
                hasError = true;
            }
        });
    });
    
    if (!hasError) {
        console.log('\n✅ 测试通过：所有员工在每一天都有排班！');
    } else {
        console.log('\n❌ 测试失败：存在员工在某些天没有排班的情况！');
    }
    
    return !hasError;
}

// 运行测试
testScheduleGeneration();