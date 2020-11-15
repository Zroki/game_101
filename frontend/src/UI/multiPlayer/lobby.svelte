<script>
    import {players, turns, lastTurn} from "../../store";
    import SocketClient from '../../classes/SocketClient'

    let isGameStart = false;
</script>

<style>

</style>

<div class="main_lobby">
    <div class="users_list">
        <ul>
            {#each $players as player, index(player)}
                <li>Name: {player.name}</li>
                {#if player.id === $players[0].id && SocketClient.socket.id === $players[0].id}
                    <button disabled={isGameStart} on:click={() => {
                        SocketClient.startGame();
                        isGameStart = true;
                    }}>Старт
                    </button>
                {/if}
                <hr>
            {/each}
        </ul>
    </div>
    <div class="turns">
        <button disabled={$lastTurn.id !== SocketClient.socket.id} on:click={() => {
            SocketClient.turn('K')
        }}>K
        </button>
        <button disabled={$lastTurn.id !== SocketClient.socket.id} on:click={() => {
            SocketClient.turn('T')
        }}>T
        </button>
        {#each $turns as turn, index(turn)}
            <div>
                <span>name: {turn.username}</span>
                <span>id: {turn.id}</span>
                <span>card: {turn.card}</span>
            </div>
        {/each}
    </div>
</div>