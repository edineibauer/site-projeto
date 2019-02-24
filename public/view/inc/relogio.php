<div class="col padding-8">
    <div class="col" id="desenvolvimentos-header">
        <div class="z-depth-2 color-white pointer left padding-large upper font-xlarge" rel="p" onclick="novoDesenvolvimento()">
            <i class="material-icons left padding-right font-xxlarge">add</i>
            Projeto
        </div>

        <div class="z-depth-2 color-white pointer left padding-large upper font-xlarge hide" rel="t" onclick="novaTarefa()">
            <i class="material-icons left padding-right font-xxlarge">add</i>
            Tarefa
        </div>
    </div>

    <div class="col padding-24" id="desenvolvimentos"></div>
</div>

<script src="<?=HOME?>assetsPublic/view/relogio.min.js?v=<?=VERSION?>"></script>
<style>
    .lista-task {
        background: #eee;
    }
    .lista-task:nth-child(even) {
        background: white;
    }
</style>