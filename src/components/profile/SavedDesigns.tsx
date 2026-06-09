import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Palette, Trash2, Calendar } from 'lucide-react';
import { getMyDesigns, deleteDesign } from '../../services/aiService';
import { ROOMS } from '../../data/rooms';
import { toast } from 'sonner';

interface DesignSummary {
  id: string;
  name: string;
  roomId: string;
  screenshotUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export const SavedDesigns: React.FC = () => {
  const [designs, setDesigns] = useState<DesignSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyDesigns()
      .then(setDesigns)
      .catch(() => toast.error('Failed to load designs'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this design?')) return;
    try {
      await deleteDesign(id);
      setDesigns((prev) => prev.filter((d) => d.id !== id));
      toast.success('Design deleted');
    } catch {
      toast.error('Failed to delete design');
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  const getRoomName = (roomId: string) =>
    ROOMS.find((r) => r.id === roomId)?.name ?? roomId;

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
        <p className="text-stone-600 mb-6">Create your first 3D room design and save it here.</p>
        <Link
          to="/ai-preview"
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-semibold rounded-full hover:bg-orange-600 transition-colors"
        >
          <Palette className="h-5 w-5" />
          Start Designing
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
        {designs.map((design) => (
          <div
            key={design.id}
            className="bg-white rounded-2xl overflow-hidden border border-stone-200 hover:shadow-xl transition-all group"
          >
            {/* Screenshot preview */}
            <div className="relative aspect-video overflow-hidden bg-stone-100">
              {design.screenshotUrl ? (
                <img
                  src={design.screenshotUrl}
                  alt={design.name}
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
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-stone-900 truncate">{design.name}</h3>
                <p className="text-xs text-stone-500 mt-0.5">{getRoomName(design.roomId)}</p>
                <p className="text-xs text-stone-400 flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(design.updatedAt)}
                </p>
              </div>

              <Link
                to={`/room-editor/${design.roomId}?designId=${design.id}`}
                className="block w-full py-2 text-center bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors text-sm"
              >
                Open in Editor
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
