import { useState } from 'react';

const SECTIONS = [
  {
    id: 'getting-started',
    icon: 'ti-rocket',
    title: 'Getting Started',
    color: '#5b8def',
    steps: [
      {
        title: 'Create your account',
        desc: 'Go to the Register page and fill in your full name, email address, and a password with at least 8 characters. Once registered, you\'ll be taken straight to your dashboard.',
        tip: 'Use a work email so teammates can find you easily when sending board invitations.'
      },
      {
        title: 'Create your first board',
        desc: 'From the dashboard, click "New Board" and give it a name like "Product Roadmap" or "Sprint 1". A board is created with three default columns: To Do, In Progress, and Done.',
        tip: 'Name your board after a project or team, not a time period — boards are reusable.'
      },
      {
        title: 'Add tasks to your board',
        desc: 'Open a board and click "+ Add a task" at the bottom of any column. Type a title, set a priority (Low / Medium / High), pick a due date, and assign it to a team member.',
        tip: 'Press Enter to quickly save a task without reaching for the mouse.'
      },
    ]
  },
  {
    id: 'boards',
    icon: 'ti-layout-kanban',
    title: 'Boards & Columns',
    color: '#a78bfa',
    steps: [
      {
        title: 'Understanding columns',
        desc: 'Every board has three columns: To Do (work not started), In Progress (actively being worked on), and Done (completed). Tasks move left-to-right as work progresses.',
        tip: null
      },
      {
        title: 'Drag and drop tasks',
        desc: 'Click and hold any task card, then drag it to a different column or reorder it within the same column. All changes sync in real time for every team member viewing the board.',
        tip: 'Drag slowly — the task snaps into its new position when you release over the target column.'
      },
      {
        title: 'Task details',
        desc: 'Each task card shows the title, priority badge (color-coded), due date with overdue highlighting in red, and the assignee\'s initials. Delete a task by hovering over it and clicking the × button in the top-right corner.',
        tip: 'Overdue tasks turn red automatically — no manual flagging needed.'
      },
    ]
  },
  {
    id: 'members',
    icon: 'ti-users',
    title: 'Team & Invitations',
    color: '#34d399',
    steps: [
      {
        title: 'Invite a teammate',
        desc: 'Open any board and click the "Invite" button in the top bar. Type the email address of an existing TaskFlow user and click Send. The invitation is delivered instantly as a notification.',
        tip: 'The person must already have a TaskFlow account — share the register link with them first.'
      },
      {
        title: 'Accepting an invitation',
        desc: 'When you receive a board invitation, a red badge appears on the bell icon in the top navigation. Click the bell, find the invite notification, and click Accept or Decline directly in the dropdown.',
        tip: 'Accepted invites add you to the board immediately — no page reload needed.'
      },
      {
        title: 'Viewing board members',
        desc: 'The stacked avatar circles in the board top bar show who is a member. Hover over any avatar to see their name. The "+N" badge shows how many additional members aren\'t displayed.',
        tip: null
      },
    ]
  },
  {
    id: 'chat',
    icon: 'ti-message-circle',
    title: 'Board Chat',
    color: '#fbbf24',
    steps: [
      {
        title: 'Opening the chat panel',
        desc: 'Inside any board, click the "Chat" button in the top-right bar. A chat panel slides open on the right side. The button turns blue when chat is active. Click it again to close.',
        tip: 'The chat panel saves all previous messages — scroll up to see the full history.'
      },
      {
        title: 'Sending messages',
        desc: 'Type your message in the input field at the bottom of the chat panel and press Enter, or click the send button. Messages appear instantly for all members currently viewing the board.',
        tip: 'A typing indicator appears for other members when you are typing.'
      },
      {
        title: 'Chat notifications',
        desc: 'If you are not currently viewing the board, new chat messages trigger a notification pushed to your bell icon. Clicking the notification takes you directly to that board with chat open.',
        tip: null
      },
    ]
  },
  {
    id: 'notifications',
    icon: 'ti-bell',
    title: 'Notifications',
    color: '#f87171',
    steps: [
      {
        title: 'The notification bell',
        desc: 'The bell icon in the top navigation bar shows a red badge with a count of unread notifications. Click it to open the notification dropdown. Notifications are delivered in real time without refreshing.',
        tip: null
      },
      {
        title: 'Notification types',
        desc: 'Blue notifications are board invitations with Accept/Decline buttons. Green notifications confirm when someone accepted your invite. Purple notifications are new chat messages from boards you are a member of.',
        tip: 'Click any notification to mark it as read and navigate to the relevant board.'
      },
      {
        title: 'Managing notifications',
        desc: 'Click "Mark all read" in the notification dropdown header to clear all unread badges at once. You can control which types of notifications you receive in Settings → Notification Preferences.',
        tip: null
      },
    ]
  },
  {
    id: 'ai',
    icon: 'ti-sparkles',
    title: 'AI Assistant',
    color: '#22d3ee',
    steps: [
      {
        title: 'Opening AI Assistant',
        desc: 'Click "AI Assistant" in the bottom of the left sidebar. The AI chat page opens. You can ask anything related to tasks, planning, writing, or productivity.',
        tip: null
      },
      {
        title: 'What you can ask',
        desc: 'Ask the AI to write task descriptions, break large projects into steps, draft team announcements, suggest prioritization strategies, or explain project management concepts. It understands context from your conversation history.',
        tip: 'Be specific — "Write a task description for migrating our database to PostgreSQL" gets a better answer than "help with tasks".'
      },
      {
        title: 'Streaming responses',
        desc: 'The AI types its response in real time as it generates it. You can click "Stop" to interrupt a long response at any time. Click "Clear chat" to start a fresh conversation.',
        tip: 'Your chat history is not saved between sessions — each page visit starts fresh.'
      },
    ]
  },
  {
    id: 'settings',
    icon: 'ti-settings',
    title: 'Settings',
    color: '#8892b0',
    steps: [
      {
        title: 'Updating your profile',
        desc: 'Go to Settings from the sidebar or top navigation. Under Profile, update your display name and email address. Changes take effect immediately and are reflected in board member lists and chat.',
        tip: null
      },
      {
        title: 'Changing your password',
        desc: 'Under Change Password, enter your current password and your new password twice. The new password must be at least 8 characters. You will stay logged in after changing your password.',
        tip: 'If you forget your current password, sign out and use the reset flow from the login page.'
      },
      {
        title: 'Deleting your account',
        desc: 'The Danger Zone at the bottom of Settings lets you permanently delete your account. You must type your exact email address to confirm. This deletes all your boards, tasks, and data immediately and cannot be undone.',
        tip: 'Transfer board ownership or invite a teammate before deleting so your work is not lost.'
      },
    ]
  },
];

export default function ManualPage() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const section = SECTIONS.find(s => s.id === activeSection);

  return (
    <div className="manual-page page-enter">
      {/* Header */}
      <div className="manual-header">
        <div className="manual-header-icon">
          <i className="ti ti-book"></i>
        </div>
        <div>
          <h1 className="page-title">User Manual</h1>
          <p className="page-sub">Everything you need to know about TaskFlow</p>
        </div>
      </div>

      <div className="manual-layout">
        {/* Sidebar nav */}
        <nav className="manual-nav">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`manual-nav-item ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => setActiveSection(s.id)}
              style={{ '--nav-color': s.color }}
            >
              <i className={`ti ${s.icon}`}></i>
              <span>{s.title}</span>
              {activeSection === s.id && (
                <i className="ti ti-chevron-right" style={{ marginLeft:'auto', fontSize:12 }}></i>
              )}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="manual-content" key={activeSection}>
          <div className="manual-section-header">
            <div className="manual-section-icon" style={{ background: `${section.color}20`, color: section.color }}>
              <i className={`ti ${section.icon}`}></i>
            </div>
            <div>
              <h2 className="manual-section-title">{section.title}</h2>
              <p className="manual-section-count">{section.steps.length} topics</p>
            </div>
          </div>

          <div className="manual-steps">
            {section.steps.map((step, i) => (
              <div key={i} className="manual-step">
                <div className="manual-step-num" style={{ background: `${section.color}20`, color: section.color }}>
                  {i + 1}
                </div>
                <div className="manual-step-body">
                  <h3 className="manual-step-title">{step.title}</h3>
                  <p className="manual-step-desc">{step.desc}</p>
                  {step.tip && (
                    <div className="manual-tip">
                      <i className="ti ti-bulb" style={{ fontSize:13, color:'var(--yellow)', flexShrink:0 }}></i>
                      <span>{step.tip}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation between sections */}
          <div className="manual-page-nav">
            {SECTIONS.findIndex(s => s.id === activeSection) > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => {
                const idx = SECTIONS.findIndex(s => s.id === activeSection);
                setActiveSection(SECTIONS[idx - 1].id);
              }}>
                <i className="ti ti-arrow-left" style={{ fontSize:13 }}></i>
                {SECTIONS[SECTIONS.findIndex(s => s.id === activeSection) - 1]?.title}
              </button>
            )}
            <div style={{ flex:1 }} />
            {SECTIONS.findIndex(s => s.id === activeSection) < SECTIONS.length - 1 && (
              <button className="btn btn-primary btn-sm" onClick={() => {
                const idx = SECTIONS.findIndex(s => s.id === activeSection);
                setActiveSection(SECTIONS[idx + 1].id);
              }}>
                {SECTIONS[SECTIONS.findIndex(s => s.id === activeSection) + 1]?.title}
                <i className="ti ti-arrow-right" style={{ fontSize:13 }}></i>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}