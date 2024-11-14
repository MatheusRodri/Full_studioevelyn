// importe de bibliotecas
import React, { useEffect, useState, useMemo, useLayoutEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import './index.css';
import servicos from '../../services/servicos';
import { auth, db } from '../../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import axios from 'axios';

// função Agendamento
function Agendamento() {
  console.log("Componente Agendamento montado");

  // variáveis
  const dataBrasilia = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  let dataComHora = new Date(dataBrasilia);
  const horarioBrasileiro = dataComHora.toTimeString().split(' ')[0].slice(0, 5);
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [dataMarca, setdataMarca] = useState(new Date().toISOString().split('T')[0]);
  const [horario, setHorario] = useState(horarioBrasileiro);
  const [servicosSelecionados, setServicosSelecionados] = useState([]);
  const [usuario, setUsuario] = useState(null);
  const [precosSelecionados, setPrecosSelecionados] = useState([]);
  const [isAgendarCalled, setIsAgendarCalled] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false); // Novo estado

  // função para buscar detalhes do usuário no firebase
  const fetchUserDetails = async () => {
    const cachedUser = JSON.parse(localStorage.getItem('usuario'));
    if (cachedUser) {
      setUsuario(cachedUser);
    } else if (!auth.currentUser) {
      nav('/login');
    } else {
      const user = auth.currentUser;

      if (!user.displayName) {
        auth.onAuthStateChanged(async (user) => {
          if (user) {
            const refDoc = doc(db, 'users', user.uid);
            const docSnap = await getDoc(refDoc);

            if (docSnap.exists()) {
              console.log(docSnap.data());
              setUsuario(docSnap.data());
              localStorage.setItem('usuario', JSON.stringify(docSnap.data()));
            } else {
              console.log("Documento não encontrado");
            }
          } else {
            nav('/login');
          }
        });
      } else {
        setUsuario(user);
      }
    }
  };

  // useEffect para buscar detalhes do usuário
  useEffect(() => {
    fetchUserDetails();
  }, []); // Rodar apenas uma vez, na montagem

  // useEffect para lidar com a lógica de agendamento
  useEffect(() => {
    console.log("Componente  atualizado");
    if (initialLoad) {
      return; // Evitar execução na montagem
    }

    console.log("Eu recarreguei");
    const status = searchParams.get('success');
    if (status === 'true' && !isAgendarCalled) {
      console.log('Pagamento realizado com sucesso', isAgendarCalled);
      setIsAgendarCalled(true); // Marque como chamado antes de chamar handleAgendar
      handleAgendar();
    } else if (status === 'false') {
      alert('Erro ao realizar pagamento');
    }

    console.log("Antes", initialLoad);
    setInitialLoad(true); // Definir como falso após a primeira execução
    console.log("Depois", initialLoad);
  }, [searchParams, initialLoad, isAgendarCalled]); // Adicionar initialLoad e isAgendarCalled como dependências

  // função para agendar e salvar no banco de dados
  const handleAgendar = async () => {
    const cachedProcedimento = JSON.parse(localStorage.getItem('procedimento'));

    console.log(cachedProcedimento);
    try {
      console.log("EU TO AQUIII");
      await fetch('http://127.0.0.1:5000/agendamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          CPF: "123",
          NOME: cachedProcedimento.displayName,
          EMAIL: cachedProcedimento.email,
          DATA: cachedProcedimento.dataMarca,
          HORA: cachedProcedimento.horario,
          VALOR: cachedProcedimento.total,
          PROCEDIMENTO: cachedProcedimento.procedimentos,
          TP_PAGAMENTO: "Online"
        }),
      });

      alert('Agendamento realizado com sucesso!');
      setIsAgendarCalled(true);
      // nav('/agendamentos');
    } catch (error) {
      console.error('Erro ao agendar:', error);
    }
  };

  // useMemo para calcular o total
  const total = useMemo(() => {
    return servicosSelecionados.reduce((acc, servicoName, index) => {
      const price = precosSelecionados[index] || 0;
      return acc + price;
    }, 0);
  }, [servicosSelecionados, precosSelecionados]);

  const handleFinishCompra = async () => {
    try {
      const procedimentos = {
        servicos: servicosSelecionados,
        precos: precosSelecionados,
        total: total,
        pagamento: 'Online',
      };

      const proce = servicosSelecionados.join(', ');
      const check = {
        cpf: "123",
        displayName: usuario.displayName,
        email: usuario.email,
        dataMarca: dataMarca,
        horario: horario,
        total: total,
        procedimentos: proce,
        pagamento: 'Online',
      }
      console.log("check", check);
      localStorage.setItem('procedimento', JSON.stringify(check));

      const { data } = await axios.post(process.env.REACT_APP_API_URL + "/create-checkout-session", {
        procedimentos
      });

      window.location.href = data.url;
    } catch (error) {
      console.error('Erro ao finalizar compra:', error);
    }
  }


  return (
    <div>
      <Header />
      <div className="agendamento-container">
        <h2>Agendamento</h2>
        {/* Input para data. */}
        <label>
          Data:
          <input type="date" value={dataMarca} onChange={(e) => setdataMarca(e.target.value)} />
        </label>
        {/* Input para horário. */}
        <label>
          Horário:
          <input type="time" value={horario} onChange={(e) => setHorario(e.target.value)} />
        </label>
        <h3>Serviços:</h3>
        {/* Lista de serviços. */}
        <ul className="servicos-list">
          {servicos.map(servico => (
            <li key={servico.name}> {/* Usa li para itens de lista. */}
              <label>
                <input
                  type="checkbox"
                  value={servico.name}
                  checked={servicosSelecionados.includes(servico.name)}
                  onChange={(e) => {
                    const valor = e.target.value;
                    const preco = parseFloat(servico.price.replace(/[^0-9,]/g, '').replace(',', '.'));
                    setServicosSelecionados(prevState =>
                      prevState.includes(valor)
                        ? prevState.filter(item => item !== valor)
                        : [...prevState, valor]
                    );
                    setPrecosSelecionados(prevState =>
                      prevState.includes(preco)
                        ? prevState.filter(item => item !== preco)
                        : [...prevState, preco]
                    );
                  }}
                />
                {servico.name}
                <br />
                R${servico.price}
              </label>
            </li>
          ))}
        </ul>
        {
          total >= 0 && (
            <p>Total: R$ {total.toFixed(2)}</p>
          )
        }
        <button onClick={handleFinishCompra}>Agendar</button>
      </div>

      <Footer />
    </div>
  );
}

export default Agendamento;
