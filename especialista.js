/*
  Exemplo de uma estrutura de base de conhecimento trabalhada por um sistema especialista.
  O modelo apresentado ao operador da ferramenta conterá uma interface que abstraia todo 
  o formalismo e regras sintáticas. A ideia é que ele fica a cargo apenas de operar com as regras 
  necessárias para a conclusão de um ou vários objetivos do sistema especialista.
*/
var especialista = {
    variaveis: {
        'PREVISAO DO TEMPO': {
            tipo: 'multivalorado'
        },
        'ASSISTIU PROGRAMA DE METEOROLOGIA': {
            tipo: 'binario'
        },
        'PRAIAS VAZIAS': {
            tipo: 'binario'
        },
        'LOCAL DE PASSEIO': {
            tipo: 'multivalorado'
        },
        'CHOVENDO': {
            tipo: 'binario'
        },
        'DISTANCIA > 5': {
            tipo: 'binario'
        },
        'CONDICAO FISICA': {
            tipo: 'multivalorado'
        },
        'TRANSPORTE': {
            tipo: 'multivalorado'
        },
        'JOGOU BOLA': {
            tipo: 'binario'
        },
        'AMIGOS LIGARAM': {
            tipo: 'binario'
        },
        'DISTANCIA < 5': {
            tipo: 'binario'
        },
        'O TEMPO ESTAVA FECHADO': {
            tipo: 'binario'
        },
        'TEMPERATURA': {
            tipo: 'multivalorado'
        },
        'O TEMPO DE CHEGADA AO LOCAL > 30 MIN': {
            tipo: 'binario'
        },
        'O DIA ESTIVER BEM ILUMINADO': {
            tipo: 'binario'
        }
    },
    regras: [
        'SE PREVISAO DO TEMPO = CHUVA ENTAO CHOVENDO = SIM',
        'SE TEMPERATURA = BAIXA ENTAO CHOVENDO = SIM',
        'SE ASSISTIU PROGRAMA DE METEOROLOGIA = SIM E PRAIAS VAZIAS = SIM ENTAO PREVISAO DO TEMPO = CHUVA',
        'SE O TEMPO ESTAVA FECHADO = SIM ENTAO PREVISAO DO TEMPO = CHUVA',
        'SE LOCAL DE PASSEIO = CACHOEIRA ENTAO DISTANCIA > 5 = SIM',
        'SE CHOVENDO = SIM E DISTANCIA > 5 = SIM E CONDICAO FISICA = RUIM ENTAO TRANSPORTE = CARRO',
        'SE CHOVENDO = NAO E DISTANCIA < 5 = SIM E CONDICAO FISICA = BOA OU CONDICAO FISICA = REGULAR ENTAO TRANSPORTE = A PE',
        'SE O DIA ESTIVER BEM ILUMINADO = SIM ENTAO CHOVENDO = NAO',
        'SE JOGOU BOLA = SIM ENTAO CONDICAO FISICA = RUIM',
        'SE AMIGOS LIGARAM = SIM ENTAO JOGOU BOLA = SIM',
        'SE O TEMPO DE CHEGADA AO LOCAL > 30 MIN = SIM ENTAO DISTANCIA > 5 = SIM'
    ],
    objetivos: [
        'TRANSPORTE'
    ]
}

/*
    Mecanismo de encadeamento de regras para a obtenção
    da conclusão.
*/

function motor_inferencia(base_de_conhecimento, pilha, objetivo) {
    if (pilha.length != 0) {

        var variaveis = lista_de_variaveis(base_de_conhecimento.regras[pilha[pilha.length - 1]])[0];
        var variaveis_valores = lista_de_variaveis(base_de_conhecimento.regras[pilha[pilha.length - 1]])[1];

        for (var i = 0; i < variaveis.length - 1; i++) {
            
            /*
                Verificar se uma dada variavel não possui valor, caso isso venha
                a ser concluído deve-se verificar se existe alguma regra que a conclua, 
                do contrário o paciente deverá responder a resposta da presente variavel.
            */

            if (!base_de_conhecimento.variaveis[variaveis[i]]['valor']) {

                var resultado = verificar_variavel(variaveis_valores[i], base_de_conhecimento.regras);
                if (resultado.length != 0) {
                    pilha.push(resultado[0][1]);
                    return motor_inferencia(base_de_conhecimento, pilha, objetivo);
                } else {
                    /*
                        Propor um modelo de apresentação adaptavel para a inferface de 
                        entrada de dados. Também apresentar uma alternativa de mensagem 
                        de retorno para uma variavel. 
                        Ex: "Seus amigos ligaram hoje?". Mensagem de retorno quando
                        trabalhada para a variavel "AMIGOS LIGARAM"
                    */

                    var msg = '', valor;

                    if (base_de_conhecimento.variaveis[variaveis[i]]['tipo'] == 'multivalorado') {
                        msg = 'DIGITE UMA VALOR PARA A VARIAVEL: ' + variaveis[i];
                    } else if (base_de_conhecimento.variaveis[variaveis[i]]['tipo'] == 'binario') {
                        msg = 'SELECIONE SIM OU NAO PARA A VARIAVEL: ' + variaveis[i];
                    }

                    valor = prompt(msg);
                    base_de_conhecimento.variaveis[variaveis[i]]['valor'] = valor.toUpperCase();
                    
                    console.log('a pilha atual de resposta e: ');
                    console.log(pilha);

                }
            } 

            /*
                Realizar a verificação lógica de todas as proposições presente na regra atual,
                está iniciará sempre no final da conclusao de uma regra. O resultado corresponde
                a conclusão da regra ou a ausência de resposta caso não seja possível concluir tal 
                fato.
            */
            if (i == variaveis.length - 2) {

                var comparar_regra = quebrar_regra(base_de_conhecimento.regras[pilha[pilha.length - 1]]);
                var resultado_operacao = verificar_regra_logica(comparar_regra, base_de_conhecimento);

                console.log(comparar_regra);
                
                if (resultado_operacao) {
                    
                    resultado_operacao = comparar_regra[comparar_regra.length - 1].split('=')[1].trim();
                    base_de_conhecimento.variaveis[variaveis[i + 1]]['valor'] = resultado_operacao;
                    pilha.pop();

                    return motor_inferencia(base_de_conhecimento, pilha, objetivo);

                } else {
                    //início cenário de erro

                    buscar_regra_alternativa(base_de_conhecimento, pilha, objetivo);

                    //reseta todas as variaveis que apareceram como indefinidas

                    for (valores in base_de_conhecimento.variaveis) {
                        if (base_de_conhecimento.variaveis[valores]['valor'] == 'INDEFINIDO') {
                            delete base_de_conhecimento.variaveis[valores]['valor'];
                        }
                    }

                    return motor_inferencia(base_de_conhecimento, [], objetivo);

                    //fim cenário de erro
                }
            }
                
        } 

    } else {
        return base_de_conhecimento;
    }
}

/*
    Buscar uma regra alternativa para o caso de erro 
*/

function buscar_regra_alternativa(base_de_conhecimento, pilha, objetivo) {
    //conclusao de uma regra
    console.log('---------pilha atual--------');
    console.log(pilha);
    console.log('-------fim pilha---------')

    var regra_corrente_pilha = base_de_conhecimento.regras[pilha[pilha.length - 1]];
    var variaveis_regra_corrente = quebrar_regra(regra_corrente_pilha);
    var variavel_conclusao = variaveis_regra_corrente[variaveis_regra_corrente.length - 1].trim();

    var lista_regras_alternativas = verificar_variavel(variavel_conclusao, base_de_conhecimento.regras);

    //buscar uma regra que seja diferente da regra atual
    for (var p = 0; p < lista_regras_alternativas.length; p++) {
        if (lista_regras_alternativas[p][1] > pilha[pilha.length - 1]) {
            pilha.pop();
            console.log('-------pilha pop---------');
            console.log(pilha);
            console.log('---------- fim pilha pop ------------');
            console.log('----------- pilha push ------------');
            pilha.push(lista_regras_alternativas[p][1]);
            console.log(pilha);
            console.log('-------------fim pilha push --------------');
            return motor_inferencia(base_de_conhecimento, pilha, objetivo);
        }

        if (p == lista_regras_alternativas.length - 1) {
            console.log('infelizmente não existe mais regras');
            pilha.pop();
            console.log(pilha);

            if (pilha.length == 1) {
                console.log('este é o ultima regra');
                console.log(variavel_conclusao);
                variavel_resultado = variavel_conclusao.split('=')[1].trim();
                variavel_conclusao = variavel_conclusao.split('=')[0].trim();
                
                //verificar qual o tipo de variavel está sendo processada
                if (base_de_conhecimento.variaveis[variavel_conclusao]['tipo'] == 'binario') {

                    if (variavel_conclusao.lastIndexOf('>') != -1 || variavel_conclusao.lastIndexOf('<') != -1
                    || variavel_conclusao.lastIndexOf('>=') != - 1 || variavel_conclusao.lastIndexOf('<=') != -1) {
                        
                        //capturar o oposto da regra 
                        if (variavel_resultado == 'SIM') {
                            base_de_conhecimento.variaveis[variavel_conclusao]['valor'] = 'NAO';
                        } else {
                            base_de_conhecimento.variaveis[variavel_conclusao]['valor'] = 'SIM';
                        }

                        if (variavel_conclusao.lastIndexOf('>') != -1) {
                            variavel_conclusao = variavel_conclusao.replace('>', '<');
                        } else if (variavel_conclusao.lastIndexOf('<') != -1) {
                            variavel_conclusao = variavel_conclusao.replace('<', '>');
                        } else if (variavel_conclusao.lastIndexOf('<=') != -1) {
                            variavel_conclusao = variavel_conclusao.replace('<=', '>=');
                        } else if (variavel_conclusao.lastIndexOf('>=') != -1) {
                            variavel_conclusao = variavel_conclusao.replace('>=', '<=');
                        }

                        if (base_de_conhecimento.variaveis[variavel_conclusao]) {
                            if (variavel_resultado == 'SIM') {
                                base_de_conhecimento.variaveis[variavel_conclusao]['valor'] = 'SIM';
                            } else {
                                base_de_conhecimento.variaveis[variavel_conclusao]['valor'] = 'NAO';
                            }
                        }

                    } else {
                        if (variavel_resultado == 'SIM') {
                            base_de_conhecimento.variaveis[variavel_conclusao]['valor'] = 'NAO';
                        } else {
                            base_de_conhecimento.variaveis[variavel_conclusao]['valor'] = 'SIM';
                        }
                    }
                } else {
                    base_de_conhecimento.variaveis[variavel_conclusao]['valor'] = 'INDEFINIDO';
                }

                return motor_inferencia(base_de_conhecimento, pilha, objetivo);
            } else {
                if (pilha.length != 0) {
                    buscar_regra_alternativa(base_de_conhecimento, pilha, objetivo);
                }
            }
        }
    }
}

/*
    Responsável por verificar o resultado por verificar a conclusão 
    lógica para uma data regra. 
*/
function verificar_regra_logica(comparar_regra, base_de_conhecimento) {
    var entrada_logica = [[], []];
    
    for (var y = 0; y < comparar_regra.length; y ++) {
        if (y < comparar_regra.length - 2) {
            if (comparar_regra[y] != 'SE' && comparar_regra[y] != 'OU' && comparar_regra[y] != 'E' && comparar_regra [y] != 'ENTAO') {
                var variavel_regra = comparar_regra[y].split('=');
        
                if (variavel_regra[1].trim() == base_de_conhecimento.variaveis[variavel_regra[0].trim()]['valor']) {
                    entrada_logica[0].unshift(true);
                } else {
                    entrada_logica[0].unshift(false); 
                }
            } else if (comparar_regra[y] == 'E' || comparar_regra[y] == 'OU') {
                entrada_logica[1].unshift(comparar_regra[y]);
            }
        }
    
        if (y == comparar_regra.length - 1) {
            var resultado_operacao = logica_dinamica(entrada_logica[0], entrada_logica[1], 0);
            return resultado_operacao;
        }
    }
}

/*
    Retornar a lista de variaveis para uma data regra apresentada.
    O valor retornado corresponde as regras enfileiradas conforme sua ordem 
    de apresentação.
*/
function lista_de_variaveis(regra) {
    var variaveis = quebrar_regra(regra);
    var lista_variaveis = [];
    var lista_variaveis_valor = [];

    for (var i = 0; i < variaveis.length; i++) {
        if (!(i % 2 == 0)) {
            lista_variaveis.push(variaveis[i].split('=')[0].trim());
            lista_variaveis_valor.push(variaveis[i].trim());
        }
    }
    
    return [lista_variaveis, lista_variaveis_valor];
}

/*
    Dentre um conjunto de regras "Base de Conhecimento", 
    verificar quais podem ser a conclusão para uma data variavel.
    Se nenhuma regra for encontrada uma lista vazia será retornada.
*/
function verificar_variavel(variavel, regras) {
    var lista_regras = [];

    for (var i = 0; i < regras.length; i++) {
        if (regras[i].lastIndexOf('ENTAO ' + variavel) != -1) {
            lista_regras.push([regras[i], i]);
        }
    }

    return lista_regras;
}

/*
    Função acessório encarregada que extrais todas as 
    variaveis presentes em uma regra de apresentação.
*/
function quebrar_regra(regra) {
    var variavel_buffer = '';
    var reservadas = ['SE', 'ENTAO', 'OU', 'E'];
    var lista_variaveis = [];
    var contador = 0;

    var tokens = regra.split(' ');
    
    for (var i = 0; i < tokens.length; i++) {
        if (!(reservadas.indexOf(tokens[i]) != -1)) {
            variavel_buffer += tokens[i] + ' ';

            if (i == (tokens.length - 1) && contador == 1) {
                lista_variaveis.push(variavel_buffer);
            }
        } else {
            if (contador == 1) {
                contador = 0;
                lista_variaveis.push(variavel_buffer.trim());
            }

            lista_variaveis.push(tokens[i]);

            contador++;
            variavel_buffer = '';
        }
    }

    return lista_variaveis;
}

/*
    Resposável por fazer uma verificação lógica dinâmica,
    dentre um conjunto de variaveis e seus respectivos conectivos lógicos (operados).
*/
function logica_dinamica(valores, operadores, incremento) {
    var resultado;
    
    if (incremento < operadores.length) {
        if (operadores[incremento] == 'E') {
            resultado = valores[incremento] && valores[incremento + 1];
        } else if (operadores[incremento] == 'OU') {
            resultado = valores[incremento] || valores[incremento + 1];
        } else if (operadores[incremento] == 'XOR') {
            if (valores[incremento] == valores[incremento + 1]) {
                return false;
            } else {
                return true;
            }
        }
        
        valores[incremento + 1] = resultado;

        return logica_dinamica(valores, operadores, incremento + 1);
    } else {
        return valores[incremento];
    }
}

// --------------------- Função Test -----------------------
//console.log(motor_inferencia(especialista, [5], 'TRANSPORTE'));
