if(typeof task === "undefined") {
    var task = null;
    var intervalo = null;
    var s = 1;
    var m = 0;
    var h = 0;
}

function readProjetos() {
    let tpl = dbLocal.exeRead("__template", 1);
    let data = db.exeRead("desenvolvimento");

    Promise.all([data, tpl]).then(r => {
        if (r[0].length)
            $("#desenvolvimentos").html(Mustache.render(r[1].cardDesenvolvimento, {data: r[0]}));
        else
            $("#desenvolvimentos-header").html("<h2>Nenhum Projeto</h2>");
    });
}

function desenvolvimento(id) {
    let tpl = dbLocal.exeRead("__template", 1);
    let data = db.exeRead("desenvolvimento", id);

    Promise.all([data, tpl]).then(r => {
        data = r[0];
        tpl = r[1];

        $.each(data.tarefas, function (i, e) {
            e.concluido = e.concluido === "1" || e.concluido === 1 || e.concluido === true ? true : false;
        });

        $("#desenvolvimentos").html(Mustache.render(tpl.cardTarefa, {tarefas: data.tarefas, idParent: id}));
    });
}

function openAtividade(id) {
    mainLoading();
    $("#dashboard").html("").form("atividade", id, "undefined");
}

function readAtividades(idDev, id) {
    let tpl = dbLocal.exeRead("__template", 1);
    let atividades = db.exeRead("atividade");

    Promise.all([atividades, tpl]).then(r => {
        atividades = r[0];
        tpl = r[1];
        let data = [];
        let total = 0;
        $.each(atividades, function (i, a) {
            if (a.tarefa_id == id) {
                data.push(a);
                total += a.minutos_de_atividade;
            }
        });

        db.exeRead("desenvolvimento", idDev).then(dev => {
            let find = !1;
            $.each(dev.tarefas, function (i, t) {
                if (find)
                    return !1;

                if (t.id == id) {
                    t.tempo_utilizado_em_minutos = total;
                    find = !0;
                } else if (t.sub_tarefas.length) {
                    $.each(t.sub_tarefas, function (e, st) {
                        if (st.id == id) {
                            st.tempo_utilizado_em_minutos = total;
                            find = !0;
                        }
                    });
                }
            });

            if (find)
                db.exeCreate("desenvolvimento", dev);
        });
        $("#atividades").html(Mustache.render(tpl.cardAtividade, {data: data, total: total}));
    });
}

function tarefa(idDev, id) {
    let tpl = dbLocal.exeRead("__template", 1);
    let data = db.exeRead("desenvolvimento", idDev);

    Promise.all([data, tpl]).then(r => {
        data = r[0];
        tpl = r[1];
        let tarefa = {};
        $.each(data.tarefas, function (i, e) {
            if (e.id == id) {
                tarefa = e;
            } else if (typeof e.sub_tarefas === "object" && e.sub_tarefas.length) {
                $.each(e.sub_tarefas, function (o, f) {
                    if (f.id == id)
                        tarefa = f;
                })
            }

            if (typeof tarefa.id !== "undefined")
                return !1;
        });

        if (typeof tarefa.id !== "undefined") {
            $("#desenvolvimentos").html(Mustache.render(tpl.atividade, {projeto: data, tarefa: tarefa}));
            restoreData();
            readAtividades(idDev, id);
            $("#atividade-titulo").focus();
        }
    });
}

function restoreData() {
    if(task !== null) {
        $("#atividade-titulo").val(task.titulo_da_atividade);
        $("#atividade-descricao").val(task.descricao);
        console.log(task);
        let tt = task.hora_de_inicio.split(" ");
        tt = tt[1].split(":");
        $("#time-start").html("iniciou as " + zeroEsquerda(tt[0]) + ":" + zeroEsquerda(tt[1]));
        $("#hora").html(zeroEsquerda(h));
        $("#segundo").html(zeroEsquerda(s));
        $("#minuto").html(zeroEsquerda(m));
    }
}

function tarefaStart(idParent, id) {
    if (task !== null) {
        tempo();
    } else {
        createAtividade(id);
    }
}

function createAtividade(id) {
    let atividade = {
        titulo_da_atividade: $("#atividade-titulo").val(),
        descricao: $("#atividade-descricao").val()
    };
    if (atividade.titulo_da_atividade.length > 2) {
        atividade.tarefa_id = id;

        var now = new Date();
        var day = zeroEsquerda(now.getDate());
        var month = zeroEsquerda(now.getMonth() + 1);
        atividade.hora_de_inicio = now.getFullYear() + "-" + month + "-" + day + " " + zeroEsquerda(now.getHours()) + ":" + zeroEsquerda(now.getMinutes());
        console.log(atividade);
        db.exeCreate("atividade", atividade).then(at => {
            task = Object.assign({}, at[0]);
            console.log(task);
            delete (task.db_action);
            delete (task.id_old);
            $("#time-start").html("iniciou as " + zeroEsquerda(now.getHours()) + ":" + zeroEsquerda(now.getMinutes()));
            tempo();
        })
    } else {
        toast("Informe um Título para a Atividade", 3500, "toast-info");
        $("#atividade-titulo").focus();
    }
}

function tarefaPause(idParent, id) {
    parar();
}

function tarefaConcluida(idDev, id) {
    if(task !== null) {
        if (confirm("Finalizar Atividade?")) {
            $("#hora, #minuto, #segundo").html("00");
            $("#atividade-titulo, #atividade-descricao").val("");
            $("#time-start").html("");

            var now = new Date();
            var day = zeroEsquerda(now.getDate());
            var month = zeroEsquerda(now.getMonth() + 1);
            task.hora_de_termino = now.getFullYear() + "-" + month + "-" + day + " " + now.getHours() + ":" + now.getMinutes();
            task.minutos_de_atividade = (s > 30 ? 1 : 0) + m + (h * 60);
            db.exeCreate("atividade", task).then(() => {
                parar();
                s = 1;
                m = 0;
                h = 0;
                readAtividades(idDev, id);
                task = null;
            });
        }
    }
}

function tempo() {
    if (!intervalo) {
        intervalo = window.setInterval(function () {
            if (s === 60) {
                m++;
                s = 0;
            }
            if (m === 60) {
                h++;
                s = 0;
                m = 0;
            }

            $("#hora").html(zeroEsquerda(h));
            $("#segundo").html(zeroEsquerda(s));
            $("#minuto").html(zeroEsquerda(m));
            s++;

        }, 1000);
    }
}

function parar() {
    clearInterval(intervalo);
    intervalo = null;
}

readProjetos();