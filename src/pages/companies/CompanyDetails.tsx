import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Edit, 
  Users, 
  ClipboardCheck,
  GraduationCap,
  Calendar,
  ChevronRight
} from 'lucide-react';

const CompanyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [company, setCompany] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:4000/companies/${id}`);
        if (!res.ok) throw new Error('Company not found');
        const companyData = await res.json();
        setCompany(companyData);
        // Fetch employees for this company
        const empRes = await fetch(`http://localhost:4000/employees?companyId=${id}`);
        const empData = empRes.ok ? await empRes.json() : [];
        setEmployees(empData);
      } catch (err) {
        setCompany(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center h-80">Loading...</div>;
  }

  if (!company) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Company not found</h2>
          <p className="text-gray-600 mt-2">The company you're looking for doesn't exist or has been removed.</p>
          <Link to="/companies" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
            Back to Companies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <Link 
          to="/companies" 
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <span className="transform rotate-180">
            <ChevronRight className="h-4 w-4 mr-1" />
          </span>
          Torna alle Aziende
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold text-white">{company.ragione_sociale?.substring(0, 2).toUpperCase()}</span>
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-800">{company.ragione_sociale}</h1>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <Link to={`/companies/${company.id}/edit`} className="btn-primary flex items-center rounded-full">
              <Edit className="h-4 w-4 mr-1" />
              Modifica Azienda
            </Link>
          </div>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Informazioni di Contatto</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-gray-800">Persona di Riferimento</span>
                  <span className="block text-sm text-gray-600">{company.persona_riferimento}</span>
                </div>
              </li>
              <li className="flex items-start">
                <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-gray-800">Telefono</span>
                  <span className="block text-sm text-gray-600">{company.telefono}</span>
                </div>
              </li>
              <li className="flex items-start">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-gray-800">Mail</span>
                  <span className="block text-sm text-gray-600">{company.mail}</span>
                </div>
              </li>
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-gray-800">Sede Azienda</span>
                  <span className="block text-sm text-gray-600">{company.sede_azienda}</span>
                </div>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Dati Aziendali</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="ml-0">
                  <span className="block text-sm font-medium text-gray-800">Codice ATECO</span>
                  <span className="block text-sm text-gray-600">{company.codice_ateco}</span>
                </div>
              </li>
              <li className="flex items-start">
                <div className="ml-0">
                  <span className="block text-sm font-medium text-gray-800">P.IVA</span>
                  <span className="block text-sm text-gray-600">{company.piva}</span>
                </div>
              </li>
              <li className="flex items-start">
                <div className="ml-0">
                  <span className="block text-sm font-medium text-gray-800">Codice Fiscale</span>
                  <span className="block text-sm text-gray-600">{company.codice_fiscale}</span>
                </div>
              </li>
              <li className="flex items-start">
                <div className="ml-0">
                  <span className="block text-sm font-medium text-gray-800">SDI</span>
                  <span className="block text-sm text-gray-600">{company.sdi}</span>
                </div>
              </li>
              <li className="flex items-start">
                <div className="ml-0">
                  <span className="block text-sm font-medium text-gray-800">PEC</span>
                  <span className="block text-sm text-gray-600">{company.pec}</span>
                </div>
              </li>
              <li className="flex items-start">
                <div className="ml-0">
                  <span className="block text-sm font-medium text-gray-800">IBAN</span>
                  <span className="block text-sm text-gray-600">{company.iban}</span>
                </div>
              </li>
              <li className="flex items-start">
                <div className="ml-0">
                  <span className="block text-sm font-medium text-gray-800">Città</span>
                  <span className="block text-sm text-gray-600">{company.citta}</span>
                </div>
              </li>
              <li className="flex items-start">
                <div className="ml-0">
                  <span className="block text-sm font-medium text-gray-800">Provincia</span>
                  <span className="block text-sm text-gray-600">{company.provincia}</span>
                </div>
              </li>
              <li className="flex items-start">
                <div className="ml-0">
                  <span className="block text-sm font-medium text-gray-800">CAP</span>
                  <span className="block text-sm text-gray-600">{company.cap}</span>
                </div>
              </li>
              <li className="flex items-start">
                <div className="ml-0">
                  <span className="block text-sm font-medium text-gray-800">Note</span>
                  <span className="block text-sm text-gray-600">{company.note}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to={`/employees?company=${company.id}`} className="bg-white p-4 rounded-full shadow flex items-center transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
          <div className="p-3 bg-blue-100 rounded-full">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">View Employees</h3>
            <p className="text-xs text-gray-500">Manage all employees</p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
        </Link>
        <Link to="#" className="bg-white p-4 rounded-full shadow flex items-center transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
          <div className="p-3 bg-green-100 rounded-full">
            <ClipboardCheck className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">Assessments</h3>
            <p className="text-xs text-gray-500">View health assessments</p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
        </Link>
        <Link to="#" className="bg-white p-4 rounded-full shadow flex items-center transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
          <div className="p-3 bg-amber-100 rounded-full">
            <GraduationCap className="h-6 w-6 text-amber-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-gray-800">Training History</h3>
            <p className="text-xs text-gray-500">Review past training</p>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
        </Link>
      </div>

      {/* Employees Section */}
      <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Employees</h2>
          <Link 
            to={`/employees?company=${company.id}`} 
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View All
          </Link>
        </div>
        <ul>
          {employees.length === 0 && (
            <li className="px-6 py-4 text-gray-500">No employees found for this company.</li>
          )}
          {employees.map((employee) => (
            <li key={employee.id} className="border-b border-gray-100 last:border-0">
              <Link 
                to={`/employees/${employee.id}`} 
                className="px-6 py-4 flex items-center hover:bg-gray-50"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                  </span>
                </div>
                <div className="ml-3 flex-grow">
                  <p className="text-sm font-medium text-gray-800">
                    {employee.first_name} {employee.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{employee.title}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Recent Employees and Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Recent Employees</h2>
            <Link 
              to={`/employees?company=${company.id}`} 
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              View All
            </Link>
          </div>
          <ul>
            {employees.slice(0, 5).map((employee) => (
              <li key={employee.id} className="border-b border-gray-100 last:border-0">
                <Link 
                  to={`/employees/${employee.id}`} 
                  className="px-6 py-4 flex items-center hover:bg-gray-50"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3 flex-grow">
                    <p className="text-sm font-medium text-gray-800">
                      {employee.first_name} {employee.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{employee.title}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Upcoming Events</h2>
          </div>
          <ul>
            {[1, 2, 3, 4, 5].map((item) => (
              <li key={item} className="border-b border-gray-100 last:border-0">
                <div className="px-6 py-4 flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May'][item - 1]}
                    </span>
                    <span className="text-sm font-medium text-blue-600">
                      {(10 + item).toString()}
                    </span>
                  </div>
                  <div className="ml-3 flex-grow">
                    <p className="text-sm font-medium text-gray-800">
                      {item % 2 === 0 
                        ? 'Health and Safety Training' 
                        : 'Annual Medical Assessments'}
                    </p>
                    <div className="flex items-center mt-1">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500 ml-1">
                        {['10 AM', '2 PM', '9 AM', '1 PM', '11 AM'][item - 1]} - {['2 PM', '5 PM', '12 PM', '4 PM', '3 PM'][item - 1]}
                      </span>
                    </div>
                  </div>
                  <button className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-full hover:bg-blue-50">
                    Details
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;