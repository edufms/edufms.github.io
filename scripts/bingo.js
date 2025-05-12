document.addEventListener('DOMContentLoaded', function () {
    const btnSortear = document.getElementById('btnSortear');
    const btnReiniciar = document.getElementById('btnReiniciar');
    const resultado = document.getElementById('resultado');
    const bolinha = document.getElementById('bolinha');
    const numeroSorteados = document.getElementById('numeroSorteados');
    const ultimosSorteados = document.getElementById('ultimosSorteados');

    // Arrays para controlar os números de cada coluna
    const colunas = {
        'B': Array.from({ length: 15 }, (_, i) => i + 1),
        'I': Array.from({ length: 15 }, (_, i) => i + 16),
        'N': Array.from({ length: 15 }, (_, i) => i + 31),
        'G': Array.from({ length: 15 }, (_, i) => i + 46),
        'O': Array.from({ length: 15 }, (_, i) => i + 61)
    };

    // Array para guardar os números já sorteados
    let numerosSorteados = [];

    // Inicializar cartela de bingo
    inicializarCartela();

    // Função para inicializar a cartela com todos os números
    function inicializarCartela() {
        for (const coluna in colunas) {
            const colunaEl = document.getElementById(`coluna-${coluna.toLowerCase()}`);
            colunaEl.innerHTML = '';

            for (const numero of colunas[coluna]) {
                const numeroEl = document.createElement('div');
                numeroEl.className = 'numero';
                numeroEl.id = `numero-${numero}`;
                numeroEl.textContent = numero;
                colunaEl.appendChild(numeroEl);
            }
        }
    }

    // Função para atualizar os últimos 3 números sorteados
    function atualizarUltimosSorteados() {
        const ultimosNumeros = numerosSorteados.slice(-3).reverse();
        const elementos = ultimosSorteados.querySelectorAll('.ultimo-numero');

        // Resetar todos para invisíveis
        elementos.forEach(el => {
            el.style.visibility = 'hidden';
            el.textContent = '-';
        });

        // Atualizar com os últimos números sorteados
        for (let i = 0; i < ultimosNumeros.length; i++) {
            const numero = ultimosNumeros[i];
            const elemento = elementos[i];

            // Determinar a coluna baseada no número
            let coluna;
            if (numero <= 15) coluna = 'B';
            else if (numero <= 30) coluna = 'I';
            else if (numero <= 45) coluna = 'N';
            else if (numero <= 60) coluna = 'G';
            else coluna = 'O';

            elemento.textContent = `${coluna}-${numero}`;
            elemento.style.visibility = 'visible';
        }
    }

    // Evento de clique no botão de sortear
    btnSortear.addEventListener('click', function () {
        if (numerosSorteados.length === 75) {
            resultado.textContent = 'Todos os números já foram sorteados!';
            return;
        }

        // Sortear um número ainda não sorteado
        let numeroSorteado;
        let coluna;

        do {
            numeroSorteado = Math.floor(Math.random() * 75) + 1;

            // Determinar a coluna baseada no número
            if (numeroSorteado <= 15) coluna = 'B';
            else if (numeroSorteado <= 30) coluna = 'I';
            else if (numeroSorteado <= 45) coluna = 'N';
            else if (numeroSorteado <= 60) coluna = 'G';
            else coluna = 'O';

        } while (numerosSorteados.includes(numeroSorteado));

        // Adicionar o número aos sorteados
        numerosSorteados.push(numeroSorteado);

        // Atualizar a interface
        resultado.textContent = `Bolinha sorteada: ${coluna} - ${numeroSorteado}`;
        bolinha.textContent = `${coluna}-${numeroSorteado}`;
        bolinha.style.display = 'inline-block';

        // Atualizar os últimos 3 números sorteados
        atualizarUltimosSorteados();

        // Marcar o número na cartela
        const numeroEl = document.getElementById(`numero-${numeroSorteado}`);
        numeroEl.classList.add('sorteado');

        // Atualizar contador
        numeroSorteados.textContent = numerosSorteados.length;

        // Desabilitar botão se todos os números foram sorteados
        if (numerosSorteados.length === 75) {
            btnSortear.disabled = true;
        }
    });

    // Evento de clique no botão de reiniciar
    btnReiniciar.addEventListener('click', function () {
        // Limpar todos os números sorteados
        numerosSorteados = [];

        // Reiniciar a interface
        resultado.textContent = 'Clique no botão para sortear';
        bolinha.style.display = 'none';
        numeroSorteados.textContent = '0';

        // Limpar os últimos números sorteados
        ultimosSorteados.querySelectorAll('.ultimo-numero').forEach(el => {
            el.style.visibility = 'hidden';
            el.textContent = '-';
        });

        // Remover classe sorteado de todos os números
        document.querySelectorAll('.numero').forEach(el => {
            el.classList.remove('sorteado');
        });

        // Habilitar o botão de sortear
        btnSortear.disabled = false;
    });

    // Implementação do modo noturno
    const darkModeToggle = document.getElementById('darkModeToggle');

    // Verificar se há uma preferência salva no localStorage
    if (localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = '🌙';
    }

    darkModeToggle.addEventListener('click', function () {
        // Alternar a classe dark-mode no body
        document.body.classList.toggle('dark-mode');

        // Atualizar o ícone do botão
        if (document.body.classList.contains('dark-mode')) {
            darkModeToggle.textContent = '🌙';
            localStorage.setItem('darkMode', 'true');
        } else {
            darkModeToggle.textContent = '☀️';
            localStorage.setItem('darkMode', 'false');
        }
    });
});