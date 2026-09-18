<script>
  import Counter from './components/Counter.svelte'
  import List from './components/List.svelte'
  import NameInput from './components/NameInput.svelte'
  import Profile from './views/Profile.svelte'

  const saved = localStorage.getItem('visits')
  const visits = saved === null ? 0 : Number(saved)
  localStorage.setItem('visits', String(visits + 1))
</script>

<main>
  <h1>{visits} visits</h1>
  <Counter />
  <List />
  <NameInput />
  <Profile />
</main>

<style>
  main {
    padding: 1rem;
  }
</style>
