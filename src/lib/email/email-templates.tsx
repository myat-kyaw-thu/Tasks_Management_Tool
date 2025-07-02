interface TaskReminderData {
  userName: string;
  task: {
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    priority: "low" | "medium" | "high";
    category?: { name: string; };
  };
  appUrl: string;
}

interface WelcomeData {
  userName: string;
  appUrl: string;
}

interface DailyDigestData {
  userName: string;
  stats: {
    total: number;
    completed: number;
    today: number;
    overdue: number;
  };
  todayTasks: Array<{
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    priority: "low" | "medium" | "high";
  }>;
  overdueTasks: Array<{
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    priority: "low" | "medium" | "high";
  }>;
  appUrl: string;
}

export const emailTemplates = {
  task_reminder: (data: TaskReminderData) => ({
    subject: `⏰ Task Reminder: ${data.task.title}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Task Reminder</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Task Reminder</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 20px;">Hi ${data.userName},</p>
            
            <p style="margin-bottom: 25px;">You have a task that needs your attention:</p>
            
            <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid ${data.task.priority === 'high' ? '#ef4444' :
        data.task.priority === 'medium' ? '#f59e0b' : '#10b981'
      }; margin-bottom: 25px;">
              <h2 style="margin: 0 0 10px 0; color: #1f2937; font-size: 20px;">${data.task.title}</h2>
              ${data.task.description ? `<p style="margin: 10px 0; color: #6b7280;">${data.task.description}</p>` : ''}
              ${data.task.category ? `<p style="margin: 10px 0; color: #6b7280;"><strong>Category:</strong> ${data.task.category.name}</p>` : ''}
              ${data.task.due_date ? `<p style="margin: 10px 0; color: #6b7280;"><strong>Due:</strong> ${new Date(data.task.due_date).toLocaleDateString()}</p>` : ''}
              <p style="margin: 10px 0; color: #6b7280;"><strong>Priority:</strong> 
                <span style="background: ${data.task.priority === 'high' ? '#fef2f2' :
        data.task.priority === 'medium' ? '#fffbeb' : '#f0fdf4'
      }; color: ${data.task.priority === 'high' ? '#dc2626' :
        data.task.priority === 'medium' ? '#d97706' : '#059669'
      }; padding: 4px 8px; border-radius: 4px; text-transform: capitalize;">${data.task.priority}</span>
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.appUrl}/tasks/${data.task.id}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Task</a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
              You're receiving this because you have email notifications enabled. 
              <a href="${data.appUrl}/settings" style="color: #667eea;">Manage preferences</a>
            </p>
          </div>
        </body>
      </html>
    `
  }),

  welcome: (data: WelcomeData) => ({
    subject: "🎉 Welcome to TaskFlow!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to TaskFlow</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Welcome to TaskFlow!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 40px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 25px;">Hi ${data.userName},</p>
            
            <p style="margin-bottom: 25px;">Welcome to TaskFlow! We're excited to help you stay organized and productive.</p>
            
            <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="margin: 0 0 15px 0; color: #1f2937;">Getting Started</h2>
              <ul style="margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 10px;">Create your first task</li>
                <li style="margin-bottom: 10px;">Organize tasks with categories</li>
                <li style="margin-bottom: 10px;">Set due dates and priorities</li>
                <li style="margin-bottom: 10px;">Track your progress</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.appUrl}/dashboard" style="background: #667eea; color: white; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; margin-right: 15px;">Get Started</a>
              <a href="${data.appUrl}/settings" style="background: transparent; color: #667eea; padding: 15px 35px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; border: 2px solid #667eea;">Settings</a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
              Need help? <a href="${data.appUrl}/help" style="color: #667eea;">Visit our help center</a>
            </p>
          </div>
        </body>
      </html>
    `
  }),

  daily_digest: (data: DailyDigestData) => ({
    subject: `📊 Your Daily Digest - ${data.stats.today} tasks today`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Daily Digest</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">📊 Daily Digest</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 18px; margin-bottom: 25px;">Hi ${data.userName},</p>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px;">
              <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #667eea;">${data.stats.total}</div>
                <div style="color: #6b7280; font-size: 14px;">Total Tasks</div>
              </div>
              <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #10b981;">${data.stats.completed}</div>
                <div style="color: #6b7280; font-size: 14px;">Completed</div>
              </div>
              <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${data.stats.today}</div>
                <div style="color: #6b7280; font-size: 14px;">Due Today</div>
              </div>
              <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #ef4444;">${data.stats.overdue}</div>
                <div style="color: #6b7280; font-size: 14px;">Overdue</div>
              </div>
            </div>
            
            ${data.todayTasks.length > 0 ? `
              <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937;">📅 Due Today</h3>
                ${data.todayTasks.map(task => `
                  <div style="border-left: 3px solid #f59e0b; padding-left: 15px; margin-bottom: 15px;">
                    <div style="font-weight: bold; color: #1f2937;">${task.title}</div>
                    ${task.description ? `<div style="color: #6b7280; font-size: 14px; margin-top: 5px;">${task.description}</div>` : ''}
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            ${data.overdueTasks.length > 0 ? `
              <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937;">⚠️ Overdue Tasks</h3>
                ${data.overdueTasks.map(task => `
                  <div style="border-left: 3px solid #ef4444; padding-left: 15px; margin-bottom: 15px;">
                    <div style="font-weight: bold; color: #1f2937;">${task.title}</div>
                    ${task.description ? `<div style="color: #6b7280; font-size: 14px; margin-top: 5px;">${task.description}</div>` : ''}
                    <div style="color: #ef4444; font-size: 12px; margin-top: 5px;">Due: ${new Date(task.due_date!).toLocaleDateString()}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.appUrl}/dashboard" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Dashboard</a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 30px;">
              <a href="${data.appUrl}/settings" style="color: #667eea;">Manage email preferences</a>
            </p>
          </div>
        </body>
      </html>
    `
  })
};
