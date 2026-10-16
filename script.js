=
let usuarioLogado = null;
let contatoAtivo = null;
let intervaloAtualizacao = null;
document.addEventListener('DOMContentLoaded', () => {
  const inputTelefone = document.getElementById('telefone');
  if (inputTelefone) {
    inputTelefone.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        avancarParaSenha();
      }
    });
  }
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        enviarMensagem();
      }
    });
  }
});
function avancarParaSenha() {
  const phoneInput = document.getElementById('telefone').value.trim();
  const phoneError = document.getElementById('phoneError');
  
  if (phoneInput === '') {
    if (phoneError) phoneError.classList.remove('hidden');
    return;
  }
  
  if (phoneError) phoneError.classList.add('hidden');
  document.getElementById('displayPhone').innerText = phoneInput;
  document.getElementById('stepPhone').classList.add('hidden');
  document.getElementById('stepPassword').classList.remove('hidden');
  
  setTimeout(() => {
    document.getElementById('senha').focus();
  }, 100);
}

function voltarParaTelefone() {
  const errorMsg = document.getElementById('errorMsg');
  if (errorMsg) errorMsg.classList.add('hidden');
  
  document.getElementById('stepPassword').classList.add('hidden');
  document.getElementById('stepPhone').classList.remove('hidden');
  document.getElementById('telefone').focus();
}

function exibirTelaCadastro() {
  document.getElementById('stepPhone').classList.add('hidden');
  document.getElementById('stepPassword').classList.add('hidden');
  document.getElementById('stepRegister').classList.remove('hidden');
  
  const subTitle = document.getElementById('loginSubTitle');
  if (subTitle) subTitle.innerText = 'Crie sua conta para utilizar a plataforma';
}
function voltarParaLogin() {
  document.getElementById('stepRegister').classList.add('hidden');
  document.getElementById('stepPhone').classList.remove('hidden');
  
  const regErrorMsg = document.getElementById('regErrorMsg');
  if (regErrorMsg) regErrorMsg.classList.add('hidden');

  const subTitle = document.getElementById('loginSubTitle');
  if (subTitle) subTitle.innerText = 'Conecte-se para conversar com seus contatos';
}
async function cadastrarUsuario(event) {
  if (event) event.preventDefault();

  const regTelefone = document.getElementById('regTelefone');
  const regNome = document.getElementById('regNome');
  const regSenha = document.getElementById('regSenha');
  const regErrorMsg = document.getElementById('regErrorMsg');

  const telefone = regTelefone ? regTelefone.value.trim() : '';
  const apelido = regNome ? regNome.value.trim() : '';
  const senha = regSenha ? regSenha.value.trim() : '';

  if (regErrorMsg) regErrorMsg.classList.add('hidden');

  try {
    const res = await fetch('http://localhost:3000/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apelido, telefone, senha })
    });

    const data = await res.json();

    if (res.ok && (data.sucesso || data.success)) {
      alert(data.mensagem || 'Conta criada com sucesso!');
      if (regTelefone) regTelefone.value = '';
      if (regNome) regNome.value = '';
      if (regSenha) regSenha.value = '';
      document.getElementById('telefone').value = telefone;
      voltarParaLogin();
    } else {
      if (regErrorMsg) {
        regErrorMsg.innerText = data.mensagem || data.message || 'Erro ao realizar o cadastro.';
        regErrorMsg.classList.remove('hidden');
      }
    }
  } catch (err) {
    console.error('Erro de conexão:', err);
    if (regErrorMsg) {
      regErrorMsg.innerText = 'Erro ao conectar com o servidor em http://localhost:3000';
      regErrorMsg.classList.remove('hidden');
    }
  }
}
async function realizarLogin(event) {
  if (event) event.preventDefault();

  const telefone = document.getElementById('telefone').value.trim();
  const senha = document.getElementById('senha').value.trim();
  const errorMsg = document.getElementById('errorMsg');

  if (errorMsg) errorMsg.classList.add('hidden');

  try {
    const res = await fetch(`http://localhost:3000/auth?telefone=${encodeURIComponent(telefone)}&senha=${encodeURIComponent(senha)}`, { 
      method: 'POST' 
    });
    
    const data = await res.json();

    if (data.isAuth) {
      usuarioLogado = data.user;
      
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('appScreen').classList.remove('hidden');
      document.getElementById('appScreen').classList.add('flex');

      document.getElementById('userNameDisplay').innerText = usuarioLogado.apelido || 'Utilizador';
      document.getElementById('userPhoneDisplay').innerText = usuarioLogado.telefone;
      document.getElementById('userAvatar').innerText = (usuarioLogado.apelido || usuarioLogado.telefone).charAt(0).toUpperCase();

      carregarContatos();
    } else {
      if (errorMsg) {
        errorMsg.innerText = 'Telefone ou senha incorretos!';
        errorMsg.classList.remove('hidden');
      }
    }
  } catch (err) {
    console.error('Erro ao realizar login:', err);
    if (errorMsg) {
      errorMsg.innerText = 'Erro ao conectar com o servidor Node.js em http://localhost:3000';
      errorMsg.classList.remove('hidden');
    }
  }
}
async function carregarContatos() {
  if (!usuarioLogado) return;

  try {
    const res = await fetch(`http://localhost:3000/utilizadores?meuTelefone=${usuarioLogado.telefone}`);
    const contatos = await res.json();
    const contactList = document.getElementById('contactList');
    
    if (!contactList) return;
    contactList.innerHTML = '';

    if (!Array.isArray(contatos) || contatos.length === 0) {
      contactList.innerHTML = `
        <div class="p-6 text-center text-xs text-gray-400">
          Nenhum outro utilizador encontrado.
        </div>`;
      return;
    }

    contatos.forEach(c => {
      const div = document.createElement('div');
      div.className = 'flex items-center px-4 py-3.5 cursor-pointer hover:bg-[#f5f6f6] border-b border-gray-100 transition-all';
      div.onclick = () => selecionarContato(c);
      div.innerHTML = `
        <div class="w-10 h-10 rounded-full bg-[#53bdeb] text-white flex items-center justify-center font-bold text-base mr-3.5 shrink-0 shadow-sm">
          ${c.apelido ? c.apelido.charAt(0).toUpperCase() : '?'}
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-semibold text-[#111b21] truncate">${c.apelido || 'Sem nome'}</h4>
          <p class="text-xs text-[#667781] truncate">${c.telefone}</p>
        </div>
      `;
      contactList.appendChild(div);
    });
  } catch (err) {
    console.error('Erro ao carregar contatos:', err);
  }
}

function selecionarContato(contato) {
  contatoAtivo = contato;
  
  const noChatSelected = document.getElementById('noChatSelected');
  if (noChatSelected) noChatSelected.classList.add('hidden');

  document.getElementById('chatName').innerText = contato.apelido || 'Contato';
  document.getElementById('chatStatus').innerText = contato.telefone;
  document.getElementById('chatAvatar').innerText = (contato.apelido || contato.telefone).charAt(0).toUpperCase();

  carregarMensagens();
  if (intervaloAtualizacao) clearInterval(intervaloAtualizacao);
  intervaloAtualizacao = setInterval(carregarMensagens, 3000);
}
async function carregarMensagens() {
  if (!contatoAtivo || !usuarioLogado) return;

  try {
    const res = await fetch(`http://localhost:3000/mensagens?remetente=${usuarioLogado.telefone}&destino=${contatoAtivo.telefone}`);
    const mensagens = await res.json();
    const area = document.getElementById('messagesArea');
    
    if (!area) return;
    area.innerHTML = '';

    if (Array.isArray(mensagens)) {
      mensagens.forEach(m => {
        const souEu = m.remetente === usuarioLogado.telefone;
        const msgDiv = document.createElement('div');
        msgDiv.className = `max-w-[70%] p-3 rounded-xl text-sm shadow-sm ${
          souEu ? 'bg-[#d9fdd3] self-end rounded-tr-none' : 'bg-white self-start rounded-tl-none'
        }`;
        msgDiv.innerText = m.mensagem;
        area.appendChild(msgDiv);
      });
    }

    area.scrollTop = area.scrollHeight;
  } catch (err) {
    console.error('Erro ao carregar mensagens:', err);
  }
}

async function enviarMensagem(e) {
  if (e) e.preventDefault();

  const input = document.getElementById('messageInput');
  const texto = input ? input.value.trim() : '';

  if (!texto || !contatoAtivo || !usuarioLogado) return;

  try {
    await fetch('http://localhost:3000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telefone: usuarioLogado.telefone,
        destino: contatoAtivo.telefone,
        mensagem: texto
      })
    });

    if (input) input.value = '';
    carregarMensagens();
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
  }
}