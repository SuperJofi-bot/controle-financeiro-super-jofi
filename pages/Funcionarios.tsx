
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
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
  Lock
} from 'lucide-react';

const Funcionarios: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  
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

    try {
      // Mapeamos 'senha' para 'senha_hash' conforme a estrutura da tabela
      const payload = {
        nome: newEmployee.nome,
        login: newEmployee.login,
        senha_hash: newEmployee.senha, // Enviando para a coluna que causou o erro
        perfil: newEmployee.perfil,
        ativo: newEmployee.ativo,
        criado_em: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('usuarios')
        .insert([payload]);

      if (insertError) throw insertError;

      // Sucesso
      setIsModalOpen(false);
      setNewEmployee({ nome: '', login: '', senha: '', perfil: 'funcionario', ativo: true });
      fetchEmployees(); 
      alert('Funcionário cadastrado com sucesso!');
    } catch (err: any) {
      console.error('Erro ao cadastrar:', err);
      setError('Falha ao cadastrar no Supabase: ' + (err.message || 'Erro desconhecido'));
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
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={20} />
          Novo Funcionário
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3 text-rose-800">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-bold text-sm">Erro de Cadastro</p>
            <p className="text-xs opacity-90">{error}</p>
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
                <h3 className="text-lg font-bold text-slate-800">Cadastrar Colaborador</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateEmployee} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  value={newEmployee.nome}
                  onChange={e => setNewEmployee({...newEmployee, nome: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: João da Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Login / E-mail</label>
                <input 
                  type="email" 
                  required
                  value={newEmployee.login}
                  onChange={e => setNewEmployee({...newEmployee, login: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="joao@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Lock size={14} className="text-slate-400" /> Senha Inicial
                </label>
                <input 
                  type="password" 
                  required
                  value={newEmployee.senha}
                  onChange={e => setNewEmployee({...newEmployee, senha: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="••••••••"
                />
                <p className="text-[10px] text-slate-400 mt-1">Este valor será salvo na coluna 'senha_hash'.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Perfil de Acesso</label>
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newEmployee.perfil}
                  onChange={e => setNewEmployee({...newEmployee, perfil: e.target.value as any})}
                >
                  <option value="funcionario">Funcionário Comum</option>
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
                  {isSaving ? 'Salvando...' : <><Save size={18} /> Salvar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome ou login..."
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
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nome / Login</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Perfil</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i} className="animate-pulse h-16 bg-slate-50/20"></tr>
                ))
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              ) : filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                        {(emp.nome || 'U').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{emp.nome}</p>
                        <p className="text-xs text-slate-400">{emp.login}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                      emp.perfil === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {emp.perfil}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${emp.ativo ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                      <span className="text-xs font-medium text-slate-600">{emp.ativo ? 'Ativo' : 'Inativo'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg">
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
