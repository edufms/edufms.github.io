document.addEventListener('DOMContentLoaded', function () {
    const btnSortear = document.getElementById('btnSortear');
    const btnReiniciar = document.getElementById('btnReiniciar');
    const resultado = document.getElementById('resultado');
    const bolinha = document.getElementById('bolinha');
    const numeroSorteados = document.getElementById('numeroSorteados');
    const totalNumeros = document.getElementById('totalNumeros');
    const ultimosSorteados = document.getElementById('ultimosSorteados');
    const progressBar = document.getElementById('progressBar');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const toggleIcon = darkModeToggle.querySelector('.toggle-icon');

    const colunas = {
        'B': Array.from({ length: 15 }, (_, i) => i + 1),
        'I': Array.from({ length: 15 }, (_, i) => i + 16),
        'N': Array.from({ length: 15 }, (_, i) => i + 31),
        'G': Array.from({ length: 15 }, (_, i) => i + 46),
        'O': Array.from({ length: 15 }, (_, i) => i + 61)
    };

    const TOTAL_NUMEROS = Object.values(colunas).flat().length;
    let numerosDisponiveis = Array.from({ length: TOTAL_NUMEROS }, (_, i) => i + 1);
    let numerosSorteados = [];
    let sorteando = false;

    totalNumeros.textContent = TOTAL_NUMEROS;

    function getColuna(numero) {
        if (numero <= 15) return 'B';
        if (numero <= 30) return 'I';
        if (numero <= 45) return 'N';
        if (numero <= 60) return 'G';
        return 'O';
    }

    function inicializarUltimosSorteados() {
        ultimosSorteados.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const el = document.createElement('div');
            el.className = 'ultimo-numero';
            el.style.visibility = 'hidden';
            el.textContent = '-';
            ultimosSorteados.appendChild(el);
        }
    }

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

    function atualizarUltimosSorteados() {
        const ultimosNumeros = numerosSorteados.slice(-3).reverse();
        const elementos = ultimosSorteados.querySelectorAll('.ultimo-numero');

        elementos.forEach(el => {
            el.style.visibility = 'hidden';
            el.textContent = '-';
        });

        for (let i = 0; i < ultimosNumeros.length; i++) {
            const numero = ultimosNumeros[i];
            const coluna = getColuna(numero);
            elementos[i].textContent = `${coluna}-${numero}`;
            elementos[i].style.visibility = 'visible';
        }
    }

    function atualizarProgresso() {
        const pct = (numerosSorteados.length / TOTAL_NUMEROS) * 100;
        progressBar.style.width = `${pct}%`;
        progressBar.setAttribute('aria-valuenow', Math.round(pct));
    }

    function falar(texto) {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(texto);
            utterance.lang = 'pt-BR';
            speechSynthesis.speak(utterance);
        }
    }

    function ativarModoEscuro() {
        document.body.classList.add('dark-mode');
        darkModeToggle.setAttribute('aria-pressed', 'true');
        toggleIcon.textContent = '🌙';
    }

    function desativarModoEscuro() {
        document.body.classList.remove('dark-mode');
        darkModeToggle.setAttribute('aria-pressed', 'false');
        toggleIcon.textContent = '☀️';
    }

    function salvarPreferencia(valor) {
        try {
            localStorage.setItem('darkMode', valor);
        } catch (_) {}
    }

    function carregarPreferencia() {
        try {
            return localStorage.getItem('darkMode');
        } catch (_) {
            return null;
        }
    }

    inicializarUltimosSorteados();
    inicializarCartela();
    atualizarProgresso();

    // Dark mode: OS preference or saved preference
    const preferenciaSalva = carregarPreferencia();
    if (preferenciaSalva === 'true') {
        ativarModoEscuro();
    } else if (preferenciaSalva === null && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        ativarModoEscuro();
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
        if (carregarPreferencia() === null) {
            if (e.matches) ativarModoEscuro();
            else desativarModoEscuro();
        }
    });

    darkModeToggle.addEventListener('click', function () {
        const isDark = document.body.classList.toggle('dark-mode');
        darkModeToggle.setAttribute('aria-pressed', isDark);
        toggleIcon.textContent = isDark ? '🌙' : '☀️';
        salvarPreferencia(isDark);
    });

    btnSortear.addEventListener('click', function () {
        if (sorteando) return;
        if (numerosSorteados.length === TOTAL_NUMEROS) {
            resultado.textContent = 'Todos os números já foram sorteados!';
            return;
        }

        sorteando = true;

        const idx = Math.floor(Math.random() * numerosDisponiveis.length);
        const numeroSorteado = numerosDisponiveis.splice(idx, 1)[0];
        const coluna = getColuna(numeroSorteado);

        numerosSorteados.push(numeroSorteado);

        const textoBolinha = `Bolinha sorteada: ${coluna} - ${numeroSorteado}`;
        falar(textoBolinha);
        resultado.textContent = textoBolinha;
        bolinha.textContent = `${coluna}-${numeroSorteado}`;
        bolinha.style.display = 'inline-block';
        bolinha.style.animation = 'none';
        void bolinha.offsetHeight;
        bolinha.style.animation = '';

        atualizarUltimosSorteados();

        const numeroEl = document.getElementById(`numero-${numeroSorteado}`);
        numeroEl.classList.remove('sorteado');
        void numeroEl.offsetHeight;
        numeroEl.classList.add('sorteado');

        numeroSorteados.textContent = numerosSorteados.length;
        atualizarProgresso();

        if (numerosSorteados.length === TOTAL_NUMEROS) {
            btnSortear.disabled = true;
        }

        setTimeout(function () {
            sorteando = false;
        }, 300);
    });

    btnReiniciar.addEventListener('click', function () {
        if (numerosSorteados.length > 0 && !confirm('Tem certeza que deseja reiniciar o jogo?')) {
            return;
        }

        numerosDisponiveis = Array.from({ length: TOTAL_NUMEROS }, (_, i) => i + 1);
        numerosSorteados = [];

        resultado.textContent = 'Clique no botão para sortear';
        bolinha.style.display = 'none';
        numeroSorteados.textContent = '0';
        atualizarProgresso();

        ultimosSorteados.querySelectorAll('.ultimo-numero').forEach(el => {
            el.style.visibility = 'hidden';
            el.textContent = '-';
        });

        document.querySelectorAll('.numero').forEach(el => {
            el.classList.remove('sorteado');
        });

        btnSortear.disabled = false;
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') {
            if (document.activeElement === btnReiniciar) return;
            if (document.activeElement !== btnSortear) {
                e.preventDefault();
                btnSortear.click();
            }
        }
    });
});
