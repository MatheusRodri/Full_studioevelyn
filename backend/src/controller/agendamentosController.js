import { Router } from "express";
import { exibirAgendamentos, criarAgendamento,exibirAgendamentoCliente } from "../repository/agendamento.js";

const servidor = Router();

// Rota para exibir todos os agendamentos
servidor.get('/agendamentos', async (req, res) => {
    try {
        const agendamentos = await exibirAgendamentos();
        res.status(200).json(agendamentos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota para criar um novo agendamento
servidor.post('/agendamentos', async (req, res) => {
    try {
        const agendamento = req.body; // Assumindo que o corpo da requisição contém o objeto agendamento
        console.log(agendamento);
        const novoAgendamento = await criarAgendamento(agendamento);
        res.status(201).json(novoAgendamento);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

servidor.get('/agendamentos/cliente/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const agendamentos = await exibirAgendamentoCliente(email);
        res.status(200).json(agendamentos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Rota para excluir um agendamento
// servidor.delete('/agendamentos/:id', async (req, res) => {
//     try {
//         const id = req.params.id;
//         const resposta = await excluirAgendamento(id);
//         res.status(200).json(resposta);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// Rota para exibir os agendamentos de um cliente


// servidor.get('/agendamentos/data', async (req, res) => {
//     try {
//         const agendamento = req.body;
    
//         console.log(agendamento);
        
//         const agendamentos = await exibirAgendamentoData(agendamento);
//         res.status(200).json(agendamentos);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

export default servidor;
