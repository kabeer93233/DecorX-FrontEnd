import React from 'react';
import { Link } from 'react-router-dom';
import { Palette, Trash2, Calendar } from 'lucide-react';
import { getSavedDesigns, deleteDesign } from '../../services/aiService';
import { toast } from 'sonner';

export const SavedDesigns: React.FC = () => {
  const [designs, setDesigns] = React.useState(getSavedDesigns());

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this design?')) {
      deleteDesign(id);
      setDesigns(getSavedDesigns());
      toast.success('Design deleted successfully');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (designs.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center">
        <Palette className="h-16 w-16 text-stone-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-stone-900 mb-2">No Saved Designs</h3>
        <p className="text-stone-600 mb-6">
          Create your first AI room design and save it here.
        </p>
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
            {/* Design Image */}
            <div className="relative aspect-video overflow-hidden bg-stone-100">
              <img
                src={design.resultImage}
                alt="Saved design"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => handleDelete(design.id)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                  title="Delete design"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Design Info */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-bold text-stone-900 truncate">{design.productName}</h3>
                <p className="text-sm text-stone-500 flex items-center gap-2 mt-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(design.createdAt)}
                </p>
              </div>

              {/* Before/After Preview */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-stone-500 mb-1">Before</p>
                  <div className="aspect-video rounded-lg overflow-hidden bg-stone-100">
                    <img
                      src={design.roomImage}
                      alt="Before"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-stone-500 mb-1">After</p>
                  <div className="aspect-video rounded-lg overflow-hidden bg-stone-100 border-2 border-orange-200">
                    <img
                      src={design.resultImage}
                      alt="After"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <Link
                to={`/product/${design.productId}`}
                className="block w-full py-2 text-center bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors text-sm"
              >
                View Product
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
