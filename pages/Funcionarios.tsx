
import React, { useState, useEffect } from 'react';
import { supabase, callEdgeFunction } from '../services/supabase';
import { User } from '../types';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  RefreshCcw,
  AlertCircle,
  X,
  Save,
  UserPlus,
  Lock,
  CheckCircle2
} from 'lucide-react';

const Funcionarios: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    nome: '',
    login: '',
    senha: '',
    perfil: 'funcionario' as 'admin' | 'funcionario',
    ativo: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: sbError } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome', { ascending: true });
      
      if (sbError) throw sbError;
      setEmployees(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar funcionários:', err);
      setError('Erro ao carregar lista. Verifique a conexão.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      /**
       * Chamada para a Edge Function 'create-user'.
       * O payload foi corrigido de 'email' para 'login' para coincidir com o que a função espera.
       */
      const { data, error: funcError } = await callEdgeFunction<any>('create-user', {
        nome: newEmployee.nome,
        login: newEmployee.login, // Chave corrigida
        password: newEmployee.senha,
        perfil: newEmployee.perfil,
        ativo: newEmployee.ativo
      });

      if (funcError) {
        // Se houver erro na função, lançamos a exceção para não criar um usuário "zumbi" apenas na tabela
        throw new Error(funcError.message || 'Erro ao criar usuário no Authentication. Verifique se a Edge Function está implantada corretamente.');
      }

      // Sucesso total (Auth + DB via Edge Function)
      setSuccess(true);
      setNewEmployee({ nome: '', login: '', senha: '', perfil: 'funcionario', ativo: true });
      fetchEmployees(); 
      setTimeout(() => setIsModalOpen(false), 2000);
      
    } catch (err: any) {
      console.error('Erro no processo de cadastro:', err);
      setError('Falha crítica: ' + (err.message || 'Verifique se a Edge Function create-user está ativa e configurada.'));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredEmployees = employees.filter(e => 
    (e.nome?.toLowerCase() || '').includes(search.toLowerCase()) || 
    (e.login?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Colaboradores</h2>
          <p className="text-slate-500">Gestão de acesso e perfis do sistema.</p>
        </div>
        <button 
          onClick={() => {
            setIsModalOpen(true);
            setSuccess(false);
            setError(null);
          }}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          Novo Funcionário
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3 text-rose-800">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <div className="text-xs">
            <p className="font-bold mb-1">Erro no Cadastro</p>
            <p className="opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Modal Novo Funcionário */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                  <UserPlus size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Novo Acesso</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            {success ? (
              <div className="p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-800">Cadastrado com Sucesso!</h4>
                <p className="text-slate-500">O acesso foi criado corretamente no Authentication e no Banco de Dados.</p>
              </div>
            ) : (
              <form onSubmit={handleCreateEmployee} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                  <input 
                    type="text" required
                    value={newEmployee.nome}
                    onChange={e => setNewEmployee({...newEmployee, nome: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ex: João da Silva"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">E-mail (Login)</label>
                  <input 
                    type="email" required
                    value={newEmployee.login}
                    onChange={e => setNewEmployee({...newEmployee, login: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="joao@empresa.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Lock size={14} className="text-slate-400" /> Senha de Acesso
                  </label>
                  <input 
                    type="password" required minLength={6}
                    value={newEmployee.senha}
                    onChange={e => setNewEmployee({...newEmployee, senha: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Perfil</label>
                  <select 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={newEmployee.perfil}
                    onChange={e => setNewEmployee({...newEmployee, perfil: e.target.value as any})}
                  >
                    <option value="funcionario">Funcionário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? 'Processando...' : <><Save size={18} /> Criar Acesso</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar colaborador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <button onClick={fetchEmployees} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Colaborador</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Perfil</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse h-16 bg-slate-50/20"></tr>
                ))
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              ) : filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                        {(emp.nome || 'U').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{emp.nome}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{emp.login}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      emp.perfil === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      {emp.perfil}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Funcionarios;
