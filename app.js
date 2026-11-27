const transactionDialog = document.querySelector('#transactionDialog');
const goalDialog = document.querySelector('#goalDialog');
const toolDialog = document.querySelector('#toolDialog');
const toast = document.querySelector('#toast');
let toastTimer;
const currency = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}
function openDialog(dialog) { dialog.showModal(); }
document.querySelector('#newTransaction').addEventListener('click', () => openDialog(transactionDialog));
document.querySelector('#addGoal').addEventListener('click', () => openDialog(goalDialog));
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
[transactionDialog, goalDialog, toolDialog].forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
}));

document.querySelector('#transactionForm').addEventListener('submit', event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const type = form.get('type');
  const amount = Number(form.get('amount'));
  const description = String(form.get('description')).trim();
  const category = String(form.get('category') || '').trim() || 'Geral';
  const row = document.createElement('div');
  row.className = 'transaction-row';
  row.dataset.type = type;
  const safeDescription = document.createElement('strong');
  safeDescription.textContent = description;
  const safeMeta = document.createElement('span');
  safeMeta.textContent = `Hoje, agora · ${category}`;
  const icon = document.createElement('div');
  icon.className = `transaction-icon ${type === 'income' ? 'grocery' : 'food'}`;
  icon.textContent = type === 'income' ? '↗' : '↘';
  const name = document.createElement('div');
  name.className = 'transaction-name';
  name.append(safeDescription, safeMeta);
  const value = document.createElement('strong');
  value.className = `transaction-value ${type === 'income' ? 'positive' : ''}`;
  value.textContent = `${type === 'income' ? '+' : '−'} ${currency(amount)}`;
  const tag = document.createElement('span');
  tag.className = `tag ${type === 'income' ? 'tag-income' : 'tag-expense'}`;
  tag.textContent = type === 'income' ? 'Receita' : 'Despesa';
  row.append(icon, name, value, tag);
  document.querySelector('#transactionList').prepend(row);
  const totalEl = document.querySelector(type === 'income' ? '#incomeAmount' : '#expenseAmount');
  const current = Number(totalEl.textContent.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  totalEl.textContent = currency(current + amount);
  const balanceEl = document.querySelector('#balanceAmount');
  const balance = Number(balanceEl.textContent.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
  balanceEl.textContent = currency(balance + (type === 'income' ? amount : -amount));
  event.currentTarget.reset();
  transactionDialog.close();
  notify('Transação adicionada ao seu painel.');
});

document.querySelector('#goalForm').addEventListener('submit', event => {
  event.preventDefault();
  const name = new FormData(event.currentTarget).get('name').trim();
  const amount = Number(new FormData(event.currentTarget).get('amount'));
  const panel = document.querySelector('.goals-panel');
  const item = document.createElement('div');
  item.className = 'goal-item';
  item.innerHTML = '<div class="goal-icon goal-safety">◇</div><div class="goal-info"><div><strong></strong><span></span></div><div class="goal-track lilac-track"><i style="width:0%"></i></div><div class="goal-meta"><span>0% concluído</span><span>Nova meta</span></div></div>';
  item.querySelector('.goal-info strong').textContent = name;
  item.querySelector('.goal-info > div:first-child > span').textContent = `R$ 0,00 de ${currency(amount)}`;
  panel.insertBefore(item, document.querySelector('#addGoal'));
  event.currentTarget.reset();
  goalDialog.close();
  notify('Sua nova meta foi criada.');
});

document.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => {
  const titles = { juros: 'Juros compostos', orcamento: 'Projeção de orçamento', economia: 'Meta de economia' };
  document.querySelector('#toolTitle').textContent = titles[button.dataset.tool];
  document.querySelector('#calcResult').textContent = 'Informe os valores e calcule sua projeção.';
  openDialog(toolDialog);
}));
document.querySelector('#toolForm').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const principal = Number(data.get('principal'));
  const monthly = Number(data.get('monthly'));
  const months = Number(data.get('years')) * 12;
  const rate = Number(data.get('rate')) / 100 / 12;
  const futureValue = rate === 0 ? principal + monthly * months : principal * (1 + rate) ** months + monthly * (((1 + rate) ** months - 1) / rate);
  document.querySelector('#calcResult').textContent = `Projeção estimada: ${currency(futureValue)}`;
});

document.querySelector('#filterButton').addEventListener('click', event => {
  const button = event.currentTarget;
  const nextFilter = button.dataset.filter === 'all' ? 'expense' : button.dataset.filter === 'expense' ? 'income' : 'all';
  const labels = { all: 'Todas', income: 'Receitas', expense: 'Despesas' };
  button.dataset.filter = nextFilter;
  button.innerHTML = `${labels[nextFilter]} <span>⌄</span>`;
  document.querySelectorAll('.transaction-row').forEach(row => {
    row.hidden = nextFilter !== 'all' && row.dataset.type !== nextFilter;
  });
});

document.querySelector('#chartRange').addEventListener('change', event => notify(`Período atualizado: ${event.target.value}.`));
document.querySelector('#logoutBtn').addEventListener('click', () => notify('Você saiu do painel de demonstração.'));

document.querySelector('#menuToggle').addEventListener('click', () => document.querySelector('#sidebar').classList.toggle('open'));
document.querySelectorAll('.nav-link[data-section]').forEach(link => link.addEventListener('click', event => {
  const targetId = link.dataset.section;
  const target = document.getElementById(targetId);
  if (!target) return;
  event.preventDefault();
  if (targetId === 'despesas') {
    document.querySelectorAll('.transaction-row').forEach(row => { row.hidden = row.dataset.type !== 'expense'; });
    const filterButton = document.querySelector('#filterButton');
    filterButton.dataset.filter = 'expense';
    filterButton.innerHTML = 'Despesas <span>⌄</span>';
  } else if (targetId === 'receitas') {
    document.querySelectorAll('.transaction-row').forEach(row => { row.hidden = false; });
    const filterButton = document.querySelector('#filterButton');
    filterButton.dataset.filter = 'all';
    filterButton.innerHTML = 'Todas <span>⌄</span>';
  }
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.querySelectorAll('.nav-link[data-section]').forEach(item => item.classList.toggle('active', item === link));
  document.querySelector('#crumbLabel').textContent = link.textContent.trim();
  document.querySelector('#sidebar').classList.remove('open');
  history.replaceState(null, '', `#${targetId}`);
}));
const sections = [...document.querySelectorAll('.nav-link[data-section]')].map(link => ({ link, section: document.getElementById(link.dataset.section) })).filter(item => item.section);
const observer = new IntersectionObserver(entries => {
  const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  const match = sections.find(item => item.section === visible.target);
  if (!match) return;
  document.querySelectorAll('.nav-link[data-section]').forEach(link => link.classList.toggle('active', link === match.link));
  document.querySelector('#crumbLabel').textContent = match.link.textContent.trim();
}, { rootMargin: '-18% 0px -68% 0px', threshold: [0, .2, .5] });
sections.forEach(({ section }) => observer.observe(section));
