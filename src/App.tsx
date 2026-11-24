

import { useState} from "react";
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate} from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import {create} from 'zustand';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";



type Level = 'junior' | 'middle' | 'senior';

type Job = {
  id: number;
  title: string;
  company: string;
  salary: number;
  remote: boolean;
  level: Level;
}

type JobCardProps = {
  job: Job;
  saved: boolean;
  onToggleSave: (id: number) => void;
}

type JobPageProps = {
  jobs: Job[];
}

type JobsPageProps = {
  jobs: Job[];
}

type JobsStore = {
  extraJobs: Job[];
  addJob: (job: Job) => void;
}

const useJobsStore = create<JobsStore>((set) => ({
  extraJobs: [],
  addJob: (job) => 
    set((state) => ({extraJobs: [...state.extraJobs, job]})),
}));

type SavedStore = {
  savedIds: number[];
  onToggleSave: (id: number) => void;
}

type SaveButtonProps = {
  saved: boolean;
  onClick: () => void;
}

const useSavedStore = create<SavedStore>((set) => ({
  savedIds: [],
  onToggleSave: (id) => 
    set((state) => ({
      savedIds: state.savedIds.includes(id)
      ? state.savedIds.filter((x) => x !== id)
      : [...state.savedIds, id],
    })),
}));

type LevelFilter = Level | 'all';
type SortBy = 'none' | 'salary-desc';

type JobFiltersProps = {
  query: string;
  onQueryChange: (value: string) => void;
  levelFilter: LevelFilter;
  onLevelFilterChange: (value: LevelFilter) => void;
  onlyRemote: boolean;
  onOnlyRemoteChange: (value: boolean) => void;
  sortBy: SortBy;
  onSortByChange: (value: SortBy) => void;
}

function SaveButton({saved, onClick}:SaveButtonProps) {
  return(
    <button className={ `px-2 py-1 mt-2 border-2 rounded-lg  ${saved ? "text-white bg-sky-500" : "text-slate-500 bg-gray-200 hover:bg-gray-400"}`} onClick={onClick}
    >
      {saved ? 'Сохранено' : 'Сохранить'}
    </button>
  )
}

function JobCard({job, saved, onToggleSave}: JobCardProps) {
  return (
    <div className="border-2 rounded-lg p-4 hover:shadow-xl bg-amber-300">
      <h2 className="text-sky-600 text-2xl">
        <Link to={`/jobs/${job.id}`}>{job.title}</Link>{saved ?' ⭐' :null}
      </h2>
      <p className="text-lg">Компания: <strong>{job.company}</strong> </p>
      <p>Зарплата: <strong>{job.salary}$</strong></p>
      <p>Требуемая квалификация: <strong>{job.level}</strong></p>
      <p>Формат работы: <strong>{job.remote === true ? 'Удалённо' : 'Офис'}</strong></p>
      <SaveButton saved={saved} onClick={() => onToggleSave(job.id)}/>
    </div>
  )
}

function JobFilters({query, levelFilter, onlyRemote, sortBy, onQueryChange, onLevelFilterChange, onOnlyRemoteChange, onSortByChange}: JobFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-4">
    <select className="border-2 rounded-lg px-2 py-1" value={levelFilter} onChange={(e) => onLevelFilterChange(e.target.value as LevelFilter)}>
    <option value="all">Все</option>
    <option value="junior">junior</option>
    <option value="middle">middle</option>
    <option value="senior">senior</option>
  </select>

  <label className="flex items-center gap-2"> <input type="checkbox" checked={onlyRemote} onChange={() => onOnlyRemoteChange(!onlyRemote)} /> Только удалённо</label>
  <input placeholder="Поиск по названию" className="border-2 rounded-lg px-2 py-1" type="text" value={query} onChange={(e) => onQueryChange(e.target.value)}/>
  <select className="border-2 rounded-lg px-2 py-1" value={sortBy} onChange={(e) => onSortByChange(e.target.value as SortBy)}>
    <option value="none">Без сортировки</option>
    <option value="salary-desc">Сначала дорогие</option>
  </select>
    </div>
  )
}

function JobsPage({jobs}: JobsPageProps) {
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [onlyRemote, setOnlyRemote] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('none');
  const [onlySaved, setOnlySaved] = useState(false);
  const savedIds = useSavedStore((state) => state.savedIds);
const onToggleSave = useSavedStore((state) => state.onToggleSave);

  const filteredJobs = jobs
  .filter((p) => !onlyRemote || p.remote)
  .filter((p) => levelFilter === 'all' || p.level === levelFilter)
  .filter((p) => query === '' || p.title.toLowerCase().includes(query.toLowerCase()))
  .filter((p) => !onlySaved || savedIds.includes(p.id));

  const visibleJobs = 
  sortBy === 'salary-desc'
  ? [...filteredJobs].sort((a, b) => b.salary - a.salary)
  : filteredJobs;
  
  return (
<>  
  <div className="max-w-3xl mx-auto p-4">
  <p>Сохранено: {savedIds.length}</p>
  <label className="flex items-center gap-2"><input type="checkbox" checked={onlySaved} onChange={() => setOnlySaved(!onlySaved)} />Только сохраненные</label>
  
  <JobFilters
  query={query}
  onQueryChange={setQuery}
  levelFilter={levelFilter}
  onLevelFilterChange={setLevelFilter}
  onlyRemote={onlyRemote}
  onOnlyRemoteChange={setOnlyRemote}
  sortBy={sortBy}
  onSortByChange={setSortBy}
  />
  

    {visibleJobs.length === 0 && <p>Ничего не найдено</p>}
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{visibleJobs.map((job) => (
    <JobCard
  key={job.id}
  job={job}
  saved={savedIds.includes(job.id)}
  onToggleSave={onToggleSave}
  />
  ))}
  </div> 
  </div>
  </>
  )
}


function JobPage({jobs}: JobPageProps){
const {id} = useParams();
const savedIds = useSavedStore((state) => state.savedIds);
const onToggleSave = useSavedStore((state) => state.onToggleSave);

const job = jobs.find((b) => b.id === Number(id));
if(!job) return <div className="max-w-3xl mx-auto p-4">
  <Link to="/" className="hover:underline text-black px-2 py-1 text-sm">Назад к списку</Link>
  <p>Вакансия не найдена</p>
  </div>;

const saved = savedIds.includes(job.id)

return (

  <div className="max-w-3xl mx-auto p-4">
    <Link to="/" className="hover:underline text-black py-1 text-sm">Назад к списку</Link>
    <div className="bg-amber-400 p-10 rounded-2xl">
    <h2 className="text-sky-600 text-2xl" >{job.title}{saved ?' ⭐' :null}</h2>
    <p className="text-lg">Компания: <strong>{job.company}</strong> </p>
      <p>Зарплата: <strong>{job.salary}$</strong></p>
      <p>Требуемая квалификация: <strong>{job.level}</strong></p>
    <p>Формат работы: <strong>{job.remote === true ? 'Удалённо' : 'Офис'}</strong></p>
    <SaveButton saved={saved} onClick={() => onToggleSave(job.id)}/>
    </div>
  </div>
)
}


const jobScheme = z.object({
  title: z.string().min(3, "Минимум 3 символа"),
  company: z.string().min(2, "Минимум 2 символа"),
  salary: z.number({error: "Введите число"}).min(1, "Оклад должен быть больше нуля"),
  level: z.enum(["junior", "middle", "senior"]),
  remote: z.boolean(),
});

type JobForm = z.infer<typeof jobScheme>;

function AddJobPage() {

  const {register, handleSubmit, formState: { errors }} = 
  useForm<JobForm> ({
    resolver: zodResolver(jobScheme),
  });

  const navigate = useNavigate();
  const addJob = useJobsStore((state) => state.addJob);

  return (
    <div className="max-w-3xl mx-auto p-4 ">
      <Link to="/" className="hover:underline text-black py-1 text-sm">Назад к списку</Link>
    <form className="bg-amber-400 p-10 rounded-2xl" onSubmit={handleSubmit((data) => {
    addJob({ id: Date.now(), ...data});
    navigate("/");
  })} >

      <label className="text-sky-600 text-2xl">Название</label>
      <input className="border m-2" {...register('title')} />
      {errors.title && <p>{errors.title.message}</p>}

      <label className="text-lg">Название компании</label>
      <input className="border m-2 text-lg" {...register('company')} />
      {errors.company && <p>{errors.company.message}</p>}<br/>

      <label className="text-lg">Оклад на руки</label>
      <input className="border" type="number" {...register('salary', {valueAsNumber: true})} />
      {errors.salary && <p>{errors.salary.message}</p>}<br/>

      <label className="text-lg">Уровень квалификации</label>
      <select className="border" {...register("level")}>
        <option value="junior">junior</option>
        <option value="middle">middle</option>
        <option value="senior">senior</option>
      </select>
      {errors.level && <p>{errors.level.message}</p>}<br/>

      <label className="text-lg">Удаленная работа?</label>
      <input type="checkbox" {...register('remote')} /> <br/>

      <button type="submit" className="px-2 py-1 mt-2 border-2 rounded-lg text-white bg-sky-500 hover:bg-sky-600">Добавить</button>

    </form>
          </div>
  )
}

function JobsApp() {
  const {data, isLoading, error} = useQuery({
    queryKey: ['jobs'],
    queryFn: () => fetch('/jobs.json').then((res) => res.json() as Promise<Job[]>),
  });
  const extraJobs = useJobsStore((state) => state.extraJobs);

  if(isLoading) return <p>Загрузка...</p>;
  if(error) return <p>Ошибка загрузки</p>;

  const allJobs = [...(data ?? []), ...extraJobs];
  return <BrowserRouter>
  <nav className="bg-gray-800 text-white px-4 py-3">
    <Link to="/" className="text-white px-2 py-1 text-2xl">Главная</Link>

    <Link to="/add" className="text-white px-2 py-1 text-xl">Добавить вакансию</Link>
  </nav>
  <Routes>
    <Route path="/"
    element={<JobsPage jobs={allJobs} />} />
    <Route path="/jobs/:id" 
    element={<JobPage jobs={allJobs} />} />
    <Route path="/add"
    element={<AddJobPage/>} />
  </Routes>
  </BrowserRouter>
}

const queryClient = new QueryClient();

function App() {  
  
return (
  <QueryClientProvider client={queryClient}>
  <JobsApp/>
  </QueryClientProvider>
)
}
export default App;
