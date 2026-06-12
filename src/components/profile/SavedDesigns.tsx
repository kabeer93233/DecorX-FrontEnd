import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Palette, Trash2, Calendar } from 'lucide-react';
import { getMyAiDesigns, deleteAiDesign } from '../../services/aiService';
import { AiDesignRecord } from '../../types/ai';
import { toast } from 'sonner';

export const SavedDesigns: React.FC = () => {
  const [designs, setDesigns] = useState<AiDesignRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyAiDesigns()
      .then(setDesigns)
      .catch(() => toast.error('Failed to load designs'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this design?')) return;
    try {
      await deleteAiDesign(id);
      setDesigns(prev => prev.filter(d => d.id !== id));
      toast.success('Design deleted');
    } catch {
      toast.error('Failed to delete design');
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-stone-200 flex items-center justify-center">
        <span className="inline-block w-8 h-8 border-4 border-orange-300 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (designs.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center">
        <Palette className="h-16 w-16 text-stone-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-stone-900 mb-2">No Saved Designs</h3>
        <p className="text-stone-600 mb-6">Create a room design in the 2D AI Designer and save it here.</p>
        <Link
          to="/ai-designer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors"
        >
          <Palette className="h-5 w-5" />
          Open AI Designer
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
          <Palette className="h-6 w-6 text-orange-500" />
          Saved Designs
        </h2>
        <p className="text-stone-600">{designs.length} design{designs.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {designs.map(design => (
          <div
            key={design.id}
            className="bg-white rounded-2xl overflow-hidden border border-stone-200 hover:shadow-xl transition-all group"
          >
            {/* Result image */}
            <div className="relative aspect-video overflow-hidden bg-stone-100">
              {design.resultImageUrl ? (
                <img
                  src={design.resultImageUrl}
                  alt={design.productName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300">
                  <Palette className="w-12 h-12" />
                </div>
              )}
              <button
                onClick={() => handleDelete(design.id)}
                className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                title="Delete design"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              {design.roomStyle && (
                <span className="absolute bottom-3 left-3 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm capitalize">
                  {design.roomStyle}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-stone-900 truncate">{design.productName}</h3>
                {design.roomType && (
                  <p className="text-xs text-orange-500 font-medium mt-0.5 capitalize">{design.roomType}</p>
                )}
                <p className="text-xs text-stone-400 flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(design.createdAt)}
                </p>
              </div>

              <Link
                to="/ai-designer"
                className="block w-full py-2 text-center bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors text-sm"
              >
                Open Designer
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
